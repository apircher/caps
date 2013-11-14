define([
    '../module',
    'ko',
    'infrastructure/datacontext',
    'plugins/router',
    'entityManagerProvider',
    'breeze',
    'durandal/system',
    'durandal/app',
    'localization',
    'infrastructure/contentReferences',
    'infrastructure/urlHelper',
    'infrastructure/treeViewModel',
    'moment',
    './siteMapViewModel'
],
function (module, ko, datacontext, router, entityManagerProvider, breeze, system, app, localization, ContentReferenceManager, urlHelper, TreeModel, moment, SiteMapViewModel) {
    
    var manager = entityManagerProvider.createManager(),
        EntityQuery = breeze.EntityQuery,
        website = ko.observable(),
        selectedSitemap = ko.observable(),
        selectedNode = ko.observable(),
        contentPreview = ko.observable(),
        supportedTranslations = localization.website.supportedTranslations(),
        isInitialized = false;

    var crmgr = new ContentReferenceManager({
        replaceFileReference: function (reference, language, context) {
            var publication = reference.context,
                publicationFile = publication.findFile(reference.fileName),
                resource = publicationFile.getResource(language),
                fileVersion = resource != null ? resource.FileVersion() : undefined;
            return urlHelper.getFileUrl(reference.fileName, fileVersion, reference.query);
        },
        replacePublicationReference: function (reference, language, context) {
            return urlHelper.getPublicationUrl(reference.id, language, reference.query);
        }
    });

    selectedSitemap.subscribe(function (newValue) {
        selectedNode(null);
        if (newValue) {
            newValue.fetchTree().then(function () {
                if (newValue.entity().rootNodes().length)
                    newValue.selectNodeByKey(newValue.entity().rootNodes()[0].Id());
            });
        }
    });

    selectedNode.subscribe(refreshPreview);

    app.on('caps:sitemapnode:saved', function (siteMapNode) {
        if (isInSelectedSiteMap(siteMapNode)) refetchNode(siteMapNode.Id());
    });
    app.on('caps:publication:created', refreshNodeIfSelected);
    app.on('caps:publication:refreshed', refreshNodeIfSelected);
    
    var vm = {
        website: website,
        sitemaps: ko.computed(function() {
            var items = website() ? website().sortedSiteMapVersions() : []
            return ko.utils.arrayMap(items, function(siteMap) {
                var smvm = new SiteMapViewModel(siteMap, manager);
                smvm.selectedNodeChanged = function (node) { if (node) selectedNode(node.entity()); };
                return smvm;
            });
        }),
        selectedSitemap: selectedSitemap,
        selectedNode: selectedNode,
        supportedTranslations: supportedTranslations,
        contentPreview: contentPreview,

        activate: function () {
            if (!isInitialized) {
                isInitialized = true;
                fetchWebsite().then(function (data) {
                    website(data.results[0]);
                    selectedSitemap(getSiteMapVM(website().latestSitemap()));
                });
            }
        },

        createSitemapVersion: function () {
            try {
                if (website()) {
                    var latestVersion = website().latestSitemap(),
                        nextVersion = latestVersion ? latestVersion.Version() + 1 : 1;

                    var sitemapVersion = latestVersion ? latestVersion.createNewVersion(nextVersion, manager)
                        : createInitialVersion(manager);

                    manager.saveChanges().then(function () {
                        selectedSitemap(getSiteMapVM(sitemapVersion));
                    })
                    .fail(function(error) {
                        system.log(error);
                    });
                }
            }
            catch (error) {
                alert(error.message);
            }

            function createInitialVersion(manager) {
                var sitemapVersion = manager.createEntity('DbSiteMap', { WebsiteId: website().Id(), Version: nextVersion }),
                    rootNode = manager.createEntity('DbSiteMapNode', { NodeType: 'ROOT', Name: 'HOME' }),
                    rootNodeResource = rootNode.getOrCreateResource('de', manager);
                rootNode.SiteMapId(sitemapVersion.Id());
                rootNodeResource.Title('Startseite');
                manager.addEntity(rootNode);
                return sitemapVersion;
            }
        },

        deleteSitemapVersion: function () {
            var sitemap = selectedSitemap().entity();
            if (sitemap) {
                var nextSelection = sitemap.nextVersion() || sitemap.previousVersion();

                try {
                    sitemap.setDeleted();
                    selectedSitemap(getSiteMapVM(nextSelection));
                }
                catch (error) {
                    alert('Die Version konnte nicht gelöscht werden.');
                }
                manager.saveChanges().fail(function(error) {
                    alert(error.message);
                });
            }
        },

        publishSitemapVersion: function() {
            selectedSitemap().entity().PublishedFrom(new Date());
            selectedSitemap().entity().PublishedBy('me');

            manager.saveChanges();
        },

        createSitemapNode: function () {
            var siteMap = selectedSitemap();
            if (siteMap && selectedNode()) {
                var node = manager.createEntity('DbSiteMapNode', { NodeType: 'PAGE' });
                manager.addEntity(node);
                node.ParentNodeId(selectedNode().Id());
                node.SiteMapId(siteMap.entity().Id());

                var nodeResource = node.getOrCreateResource('de', manager);
                nodeResource.Title('Seite ' + (new Date()).toLocaleTimeString());

                manager.saveChanges().then(function () {
                    siteMap.refreshTree();
                    siteMap.selectNodeByKey(node.Id());
                })
                .fail(function (error) {
                    alert(error.message);
                });
            }
        },

        deleteSitemapNode: function () {
            var siteMap = selectedSitemap();
            if (siteMap && selectedNode()) {
                var btnOk = 'Seite löschen';
                var btnCancel = 'Abbrechen';
                app.showMessage('Soll die Seite wirklich gelöscht werden?', 'Seite löschen', [btnOk, btnCancel])
                    .then(function (result) {
                        if (result === btnOk) {
                            var selection = selectedNode(),
                                nextSelection = selection.nextNode() || selection.previousNode() || selection.ParentNode();
                            deleteSitemapNode(selection).then(function () {
                                siteMap.refreshTree();
                                if (nextSelection) siteMap.selectNodeByKey(nextSelection.Id());
                            })
                            .fail(function (error) {
                                alert(error.message);
                            });
                        }
                    });
            }
            
            function deleteSitemapNode(node) {
                node.setDeleted();
                return manager.saveChanges();
            }
        },

        editWebsite: function () {
            router.navigate('#website');
        },

        editTranslation: function (language) {
            if (selectedNode()) module.router.navigate('#sitemap/translate/' + selectedNode().Id() + '/' + language.culture);
        },

        editSitemapNode: function () {
            if (selectedNode()) module.router.navigate('#sitemap/edit/' + selectedNode().Id());
        },

        moveSelectedNodeUp: function () {
            if (selectedNode()) {
                selectedNode().moveUp();
                manager.saveChanges().then(function () {
                    if (selectedSitemap()) selectedSitemap().refreshTree();
                });
            }
        },

        moveSelectedNodeDown: function () {
            if (selectedNode()) {
                selectedNode().moveDown();
                manager.saveChanges().then(function () {
                    if (selectedSitemap()) selectedSitemap().refreshTree();
                });
            }
        },

        moveSelectedNode: function () {
            if (selectedSitemap()) {
                var siteMap = selectedSitemap(),
                    node = selectedNode();
                app.selectSiteMapNode({ module: module, nodeFilter: filterSelection, siteMapId: siteMap.entity().Id(), canSelectSiteMap: false }).then(function (result) {
                    if (result.dialogResult && result.selectedNode && result.selectedNode.Id() !== node.ParentNodeId()) {
                        node.reparent(result.selectedNode);
                        manager.saveChanges().then(function () {
                            siteMap.refreshTree();
                            siteMap.tree().selectedNode().ensureVisible();
                        });
                    }
                });
            }

            function filterSelection(item) {
                return item.Id() !== selectedNode().Id();
            }
        }
    };

    function refreshNodeIfSelected(siteMapNode) {
        if (isInSelectedSiteMap(siteMapNode)) refetchNode(siteMapNode.Id()).then(function () {
            if (selectedSitemap()) selectedSitemap().refreshTree();
            refreshPreview();
        });
    }

    function refreshPreview() {
        contentPreview(null);
        if (selectedNode() && selectedNode().ContentId()) {
            var query = new EntityQuery().from('Publications').where('Id', '==', selectedNode().ContentId())
                .expand("ContentParts.Resources, Files.Resources.FileVersion.File");
            manager.executeQuery(query).then(function (data) {
                // Show preview
                var cp = new ContentPreviewViewModel(selectedNode());
                contentPreview(cp);
            })
            .fail(function (error) {
                alert(error.message);
            });
        }
    }

    function getSiteMapVM(entity) {
        return ko.utils.arrayFirst(vm.sitemaps(), function (smvm) {
            return smvm.entity() === entity;
        });
    }

    function isInSelectedSiteMap(node) {
        var siteMap = selectedSitemap();
        return node && siteMap && node.SiteMapId() === siteMap.entity().Id();
    }

    function fetchWebsite() {
        var query = new EntityQuery().from('Websites').expand('SiteMapVersions').take(1);
        return manager.executeQuery(query);
    }

    function refetchNode(nodeId) {
        var query = new EntityQuery().from('SiteMapNodes').where('Id', '==', nodeId).expand('Resources');
        return manager.executeQuery(query);
    }

    /*
     * ContentPreviewViewModel class
     */
    function ContentPreviewViewModel(sitemapNode) {
        var self = this;

        self.sitemapNode = sitemapNode;
        self.template = ko.observable();

        if (sitemapNode && sitemapNode.Content()) {
            self.template(sitemapNode.Content().template());
        }

        self.findContentPart = function (templateCell) {
            if (selectedNode() && selectedNode().Content()) {
                var cp = selectedNode().Content().getContentPart(templateCell.name);
                if (cp) {
                    var context = selectedNode().Content(),
                        content = cp.getResource('de').Content();
                    return crmgr.replaceReferences(context, content, 'de');
                }
            }
            return '';
        };
    }
    
    return vm;
});