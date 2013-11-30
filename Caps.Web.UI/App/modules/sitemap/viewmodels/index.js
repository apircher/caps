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
    './siteMapViewModel',
    'infrastructure/publicationService',
    'authentication'
],
function (module, ko, datacontext, router, entityManagerProvider, breeze, system, app, localization, ContentReferenceManager, urlHelper, TreeModel, moment, SiteMapViewModel, publicationService, authentication) {
    
    var manager = entityManagerProvider.createManager(),
        EntityQuery = breeze.EntityQuery,
        website = ko.observable(),
        selectedSiteMap = ko.observable(),
        selectedNode = ko.observable(),
        teasers = ko.observableArray(),
        contentPreview = ko.observable(),
        supportedTranslations = localization.website.supportedTranslations(),
        isInitialized = false;

    var crmgr = new ContentReferenceManager({
        replaceFileReference: function (reference, language, context) {
            var publication = reference.context,
                publicationFile = publication.findFile(reference.fileName),
                resource = publicationFile.getResource(language),
                fileVersion = resource !== null ? resource.FileVersion() : undefined;
            return urlHelper.getFileUrl(reference.fileName, fileVersion, reference.query);
        },
        replacePublicationReference: function (reference, language, context) {
            return urlHelper.getPublicationUrl(reference.id, language, reference.query);
        }
    });

    selectedSiteMap.subscribe(function (newValue) {
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
            var items = website() ? website().sortedSiteMapVersions() : [];
            return ko.utils.arrayMap(items, function(siteMap) {
                var smvm = new SiteMapViewModel(siteMap, manager);
                smvm.selectedNodeChanged = function (node) { if (node) selectedNode(node.entity()); };
                return smvm;
            });
        }),
        selectedSiteMap: selectedSiteMap,
        selectedNode: selectedNode,
        teasers: teasers,
        supportedTranslations: supportedTranslations,
        contentPreview: contentPreview,

        activate: function () {
            if (!isInitialized) {
                isInitialized = true;
                fetchWebsite().then(function (data) {
                    website(data.results[0]);
                    selectedSiteMap(getSiteMapVM(website().latestSiteMap()));
                });
            }
        },

        createSiteMapVersion: function () {
            try {
                if (website()) {
                    var latestVersion = website().latestSiteMap(),
                        nextVersion = latestVersion ? latestVersion.Version() + 1 : 1;

                    var sitemapVersion = latestVersion ? latestVersion.createNewVersion(nextVersion, manager)
                        : createInitialVersion(manager);

                    manager.saveChanges().then(function () {
                        selectedSiteMap(getSiteMapVM(sitemapVersion));
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

        deleteSiteMapVersion: function () {
            var btnOk = 'Sitemap-Version verwerfen';
            var btnCancel = 'Abbrechen';
            app.showMessage('Soll diese Version wirklich verworfen werden?', 'Sitemap-Version verwerfen?', [btnOk, btnCancel]).then(function (result) {
                if (result === btnOk) {
                    var sitemap = selectedSiteMap().entity();
                    if (sitemap) {
                        var nextSelection = sitemap.nextVersion() || sitemap.previousVersion();

                        try {
                            sitemap.setDeleted();
                            selectedSiteMap(getSiteMapVM(nextSelection));
                        }
                        catch (error) {
                            alert('Die Version konnte nicht gelöscht werden.');
                        }
                        manager.saveChanges().fail(function(error) {
                            alert(error.message);
                        });
                    }
                }
            });

        },

        publishSiteMapVersion: function() {
            selectedSiteMap().entity().PublishedFrom(new Date());
            selectedSiteMap().entity().PublishedBy(authentication.user().userName());

            manager.saveChanges();
        },

        createSiteMapNode: function () {
            var siteMap = selectedSiteMap();
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

        deleteSiteMapNode: function () {
            var siteMap = selectedSiteMap();
            if (siteMap && selectedNode()) {
                var btnOk = 'Seite löschen';
                var btnCancel = 'Abbrechen';
                app.showMessage('Soll die Seite wirklich gelöscht werden?', 'Seite löschen', [btnOk, btnCancel])
                    .then(function (result) {
                        if (result === btnOk) {
                            var selection = selectedNode(),
                                nextSelection = selection.nextNode() || selection.previousNode() || selection.ParentNode();
                            deleteSiteMapNode(selection).then(function () {
                                siteMap.refreshTree();
                                if (nextSelection) siteMap.selectNodeByKey(nextSelection.Id());
                            })
                            .fail(function (error) {
                                alert(error.message);
                            });
                        }
                    });
            }
            
            function deleteSiteMapNode(node) {
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

        editSiteMapNode: function () {
            if (selectedNode()) module.router.navigate('#sitemap/edit/' + selectedNode().Id());
        },

        moveSelectedNodeUp: function () {
            if (selectedNode()) {
                selectedNode().moveUp();
                manager.saveChanges().then(function () {
                    if (selectedSiteMap()) selectedSiteMap().refreshTree();
                });
            }
        },

        moveSelectedNodeDown: function () {
            if (selectedNode()) {
                selectedNode().moveDown();
                manager.saveChanges().then(function () {
                    if (selectedSiteMap()) selectedSiteMap().refreshTree();
                });
            }
        },

        moveSelectedNode: function () {
            if (selectedSiteMap()) {
                var siteMap = selectedSiteMap(),
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
        },

        createTeaser: function () {
            if (selectedNode()) {
                var siteMapId = selectedSiteMap().entity().Id();
                var rootNodeId = selectedSiteMap().tree().root.childNodes()[0].entity().Id();
                publicationService.createTeaser(siteMapId, rootNodeId, selectedNode().Id());
            }
        }
    };

    function refreshNodeIfSelected(siteMapNode) {
        if (isInSelectedSiteMap(siteMapNode)) refetchNode(siteMapNode.Id()).then(function () {
            if (selectedSiteMap()) selectedSiteMap().refreshTree();
            refreshPreview();
        });
    }

    function refreshPreview() {
        contentPreview(null);
        if (selectedNode() && selectedNode().ContentId()) {
            var query = new EntityQuery().from('Publications').where('Id', '==', selectedNode().ContentId())
                .expand("Translations, ContentParts.Resources, Files.Resources.FileVersion.File");
            manager.executeQuery(query).then(function (data) {
                // Show preview
                var cp = new ContentPreviewViewModel(selectedNode());
                contentPreview(cp);
            })
            .fail(function (error) {
                alert(error.message);
            });
        }

        refreshTeasers();
    }

    function refreshTeasers() {
        teasers(null);

        if (selectedNode()) {
            var coll = ko.utils.arrayFilter(selectedNode().childNodes(), function (node) {
                return node.NodeType().toLowerCase() === 'teaser';
            });
            teasers(coll);
        }
    }

    function getSiteMapVM(entity) {
        return ko.utils.arrayFirst(vm.sitemaps(), function (smvm) {
            return smvm.entity() === entity;
        });
    }

    function isInSelectedSiteMap(node) {
        var siteMap = selectedSiteMap();
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