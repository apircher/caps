define([
    '../module',
    'ko',
    'plugins/router',
    'durandal/system',
    'durandal/app',
    'localization',
    './siteMapViewModel',
    './publicationViewModel',
    'infrastructure/publicationService',
    'authentication',
    '../datacontext'
],
function (module, ko, router, system, app, localization, SiteMapViewModel, PublicationViewModel, publicationService, authentication, datacontext) {
    
    var website = ko.observable(),
        selectedSiteMap = ko.observable(),
        selectedNode = ko.observable(),
        selectedPublication = ko.observable(),
        supportedTranslations = localization.website.supportedTranslations(),
        isInitialized = false;
    
    selectedSiteMap.subscribe(selectedSiteMapChanged);
    selectedNode.subscribe(refreshPreview);

    app.on('caps:sitemapnode:saved', function (siteMapNode) {
        if (isInSelectedSiteMap(siteMapNode)) datacontext.fetchSiteMapNode(siteMapNode.Id());
    });
    app.on('caps:publication:created', refreshNodeIfSelected);
    app.on('caps:publication:refreshed', refreshNodeIfSelected);
    
    var vm = {
        website: website,
        siteMapVersions: ko.computed(function() {
            var items = website() ? website().sortedSiteMapVersions() : [];
            return ko.utils.arrayMap(items, createSiteMapVersionViewModel);
        }),
        selectedSiteMap: selectedSiteMap,
        selectedNode: selectedNode,
        selectedPublication: selectedPublication,
        teasers: ko.computed(function() {
            if (!selectedNode()) return [];
            return ko.utils.arrayFilter(selectedNode().childNodes(), function (node) {
                return node.NodeType().toLowerCase() === 'teaser';
            });
        }),
        supportedTranslations: supportedTranslations,

        activate: function () {
            if (!isInitialized) {
                isInitialized = true;
                datacontext.fetchFirstWebsite().then(function (data) {
                    website(data.results[0]);
                    selectSiteMapVersion(website().latestSiteMap());
                })
                .fail(handleError);
            }
        },

        createSiteMapVersion: function () {
            datacontext.createNewSiteMapVersion(website())
                .then(selectSiteMapVersion).fail(handleError);
        },

        deleteSiteMapVersion: function () {
            var btnOk = 'Sitemap-Version verwerfen',
                btnCancel = 'Abbrechen',
                sitemap = selectedSiteMap().entity();
            if (!sitemap) return;
            app.showMessage('Soll diese Version wirklich verworfen werden?', 'Sitemap-Version verwerfen?', [btnOk, btnCancel]).then(function (result) {
                if (result === btnOk) {
                    var nextSelection = sitemap.nextVersion() || sitemap.previousVersion();
                    selectSiteMapVersion(nextSelection);
                    datacontext.deleteSiteMapVersion(sitemap).fail(handleError);
                }
            });
        },

        publishSiteMapVersion: function () {
            datacontext.publishSiteMap(selectedSiteMap().entity(), authentication.user().userName());
        },

        createSiteMapNode: function () {
            if (!selectedSiteMap() || !selectedNode()) return;
            datacontext.createSiteMapNode(selectedSiteMap().entity(), selectedNode()).then(function (node) {
                siteMap.refreshTree();
                siteMap.selectNodeByKey(node.Id());
            })
            .fail(handleError);
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
                            datacontext.deleteSiteMapNode(selection).then(function () {
                                siteMap.refreshTree();
                                if (nextSelection) siteMap.selectNodeByKey(nextSelection.Id());
                            })
                            .fail(handleError);
                        }
                    });
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
                datacontext.saveChanges().then(function () {
                    if (selectedSiteMap()) selectedSiteMap().refreshTree();
                });
            }
        },

        moveSelectedNodeDown: function () {
            if (selectedNode()) {
                selectedNode().moveDown();
                datacontext.saveChanges().then(function () {
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
                        datacontext.saveChanges().then(function () {
                            siteMap.refreshTree();
                            siteMap.tree().selectedNode().ensureVisible();
                        });
                    }
                });
            }

            function filterSelection(item) {
                return !item.isTeaser() && item.Id() !== selectedNode().Id();
            }
        },

        createTeaser: function () {
            if (selectedNode()) {
                var siteMapId = selectedSiteMap().entity().Id();
                var rootNodeId = selectedSiteMap().tree().root.childNodes()[0].entity().Id();
                publicationService.createTeaser(siteMapId, rootNodeId, selectedNode().Id());
            }
        },

        canCreateTeaser: function () {
            if (selectedNode()) {
                if (selectedNode().NodeType() == 'ROOT' || selectedNode().hasTeasers()) return false;
                return true;
            }
            return false;
        }
    };

    function refreshNodeIfSelected(siteMapNode) {
        if (isInSelectedSiteMap(siteMapNode)) {
            datacontext.fetchSiteMapNode(siteMapNode.Id()).then(function () {
                if (selectedSiteMap()) selectedSiteMap().refreshTree();
                refreshPreview();
            });
        }
    }

    function selectedSiteMapChanged(newValue) {
        selectedNode(null);
        if (newValue) newValue.fetchTree().then(function () {
            newValue.selectRootNode()
        });
    }

    function refreshPreview() {
        selectedPublication(null);
        if (selectedNode() && selectedNode().ContentId()) {
            datacontext.fetchPublication(selectedNode().ContentId()).then(function (p) {
                var cp = new PublicationViewModel(selectedNode());
                selectedPublication(cp);
            })
            .fail(handleError);
        }
    }

    function selectSiteMapVersion(entity) {
        var hit = ko.utils.arrayFirst(vm.siteMapVersions(), function (smvm) {
            return smvm.entity() === entity;
        });
        selectedSiteMap(hit);
    }

    function createSiteMapVersionViewModel(entity) {
        var smvm = new SiteMapViewModel(entity);
        smvm.selectedNodeChanged = function (node) { if (node) selectedNode(node.entity()); };
        return smvm;
    }

    function isInSelectedSiteMap(node) {
        return selectedSiteMap() && selectedSiteMap().containsNode(node);
    }

    function handleError(error) {
        system.log(error.message);
        alert(error.message);
    }
    
    return vm;
});