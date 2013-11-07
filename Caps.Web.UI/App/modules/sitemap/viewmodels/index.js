define([
    '../module',
    'ko',
    'infrastructure/datacontext',
    'plugins/router',
    'entityManagerProvider',
    'breeze',
    'durandal/system',
    'durandal/app',
    'infrastructure/websiteMetadata'
],
function (module, ko, datacontext, router, entityManagerProvider, breeze, system, app, websiteMetadata) {
    
    var manager = entityManagerProvider.createManager(),
        website = ko.observable(),
        selectedSitemap = ko.observable(),
        selectedNode = ko.observable(),
        EntityQuery = breeze.EntityQuery,
        supportedTranslations = websiteMetadata.getSiteInfo().supportedTranslations(),
        isInitialized = false;

    function fetchWebsite() {
        var query = new EntityQuery().from('Websites').expand('Sitemaps, Sitemaps.Nodes, Sitemaps.Nodes.Resources').take(1);
        return manager.executeQuery(query);
    }

    function deleteSitemapNode(node) {
        node.setDeleted();
        return manager.saveChanges();
    }

    selectedSitemap.subscribe(function () {
        selectedNode(null);
    });

    app.on('caps:sitemapnode:saved', function (sitemapNode) {
        if (selectedSitemap() && sitemapNode && sitemapNode.SitemapId() === selectedSitemap().Id()) {
            var query = new EntityQuery().from('SitemapNodes').where('Id', '==', sitemapNode.Id()).expand('Resources');
            manager.executeQuery(query);
        }
    });

    app.on('caps:publication:created', function (sitemapNode) {
        if (selectedSitemap() && sitemapNode && sitemapNode.SitemapId() === selectedSitemap().Id()) {
            var query = new EntityQuery().from('SitemapNodes').where('Id', '==', sitemapNode.Id()).expand('Resources');
            manager.executeQuery(query);
        }
    });
    
    var vm = {
        website: website,
        sitemaps: ko.computed(function() {
            var items = [],
                w = website();
            if (w) {
                items = w.Sitemaps().slice(0);
                items.sort(function (a, b) {
                    var vA = a.Version(), vB = b.Version();
                    return vA == vB ? 0 : vA > vB ? -1 : 1;
                });
            }
            return items;
        }),
        selectedSitemap: selectedSitemap,
        selectedNode: selectedNode,
        supportedTranslations: supportedTranslations,

        activate: function () {
            if (!isInitialized) {
                isInitialized = true;
                fetchWebsite().then(function (data) {
                    website(data.results[0]);
                    var latest = website().latestSitemap();
                    if (latest) {
                        selectedSitemap(latest);
                        if (latest.rootNodes().length)
                            selectedNode(latest.rootNodes()[0]);
                    }
                });
            }
        },

        editWebsite: function () {
            router.navigate('#website');
        },

        createSitemapVersion: function () {
            if (website()) {
                var latestVersion = website().latestSitemap(),
                    nextVersion = latestVersion ? latestVersion.Version() + 1 : 1;

                var sitemapVersion = manager.createEntity('Sitemap', { WebsiteId: website().Id(), Version: nextVersion }),
                    rootNode = manager.createEntity('SitemapNode', { NodeType: 'ROOT', ExternalName: 'HOME' }),
                    rootNodeResource = rootNode.getOrCreateResource('de', manager);
                rootNode.SitemapId(sitemapVersion.Id());
                rootNodeResource.Title('Startseite');
                manager.addEntity(rootNode);

                manager.saveChanges().then(function () {
                    selectedSitemap(sitemapVersion);
                })
                .fail(function(error) {
                    system.log(error);
                });
            }
        },

        deleteSitemapVersion: function () {
            var sitemap = selectedSitemap();
            if (sitemap) {
                var nextSelection = sitemap.nextVersion() || sitemap.previousVersion();
                selectedSitemap(nextSelection);

                try {
                    sitemap.setDeleted();
                }
                catch (error) {
                    alert('Die Version konnte nicht gelöscht werden.');
                }
                manager.saveChanges().fail(function(error) {
                    alert(error.message);
                });
            }
        },

        selectNode: function (node) {
            selectedNode(node);
        },

        createSitemapNode: function () {
            if (selectedNode()) {
                var node = manager.createEntity('SitemapNode', { NodeType: 'PAGE' });
                manager.addEntity(node);
                node.ParentNodeId(selectedNode().Id());
                node.SitemapId(selectedSitemap().Id());

                var nodeResource = node.getOrCreateResource('de', manager);
                nodeResource.Title('Seite ' + (new Date()).toLocaleTimeString());

                manager.saveChanges().then(function () {
                    selectedNode(node);
                })
                .fail(function (error) {
                    alert(error.message);
                });
            }
        },

        editTranslation: function (language) {
            if (selectedNode()) {
                module.router.navigate('#sitemap/translate/' + selectedNode().Id() + '/' + language.culture);
            }
        },

        editSitemapNode: function () {
            if (selectedNode()) {
                module.router.navigate('#sitemap/edit/' + selectedNode().Id());
            }
        },

        deleteSitemapNode: function () {
            if (selectedNode()) {
                var btnOk = 'Seite löschen';
                var btnCancel = 'Abbrechen';
                app.showMessage('Soll die Seite wirklich gelöscht werden?', 'Seite löschen', [btnOk, btnCancel])
                    .then(function (result) {
                        if (result === btnOk) {
                            var selection = selectedNode(),
                                nextSelection = selection.nextNode() || selection.previousNode() || selection.ParentNode();
                            if (nextSelection) selectedNode(nextSelection);
                            deleteSitemapNode(selection).fail(function (error) {
                                alert(error.message);
                            });
                        }
                    });
            }
        }
    };

    return vm;
});