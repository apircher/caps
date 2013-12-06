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
    '../datacontext',
    'durandal/composition',
    'moment'
],
function (module, ko, router, system, app, localization, SiteMapViewModel, PublicationViewModel, publicationService, authentication, datacontext, composition, moment) {
    
    var website = ko.observable(),
        selectedSiteMap = ko.observable(),
        selectedNode = ko.observable(),
        selectedPublication = ko.observable(),
        selectedTeaser = ko.observable(),
        properties = ko.observable(),
        isInitialized = false,
        isActive = false;
    
    selectedSiteMap.subscribe(selectedSiteMapChanged);
    selectedNode.subscribe(selectedNodeChanged);

    app.on('caps:sitemapnode:saved', function (siteMapNode) {
        if (isInSelectedSiteMap(siteMapNode)) datacontext.fetchSiteMapNode(siteMapNode.Id());
    });
    app.on('caps:publication:created', refreshNodeIfSelected);
    app.on('caps:publication:refreshed', refreshNodeIfSelected);

    module.on('module:activate', function () {
        if (isActive) {
            attachKeyHandler();
            registerCompositionComplete();
        }
    });
    module.on('module:deactivate', function () {
        if (isActive) detachKeyHandler();
    });
    
    var vm = {
        website: website,
        siteMapVersions: ko.computed(function() {
            var items = website() ? website().sortedSiteMapVersions() : [];
            return ko.utils.arrayMap(items, createSiteMapVersionViewModel);
        }),
        selectedSiteMap: selectedSiteMap,
        selectedNode: selectedNode,
        selectedPublication: selectedPublication,
        properties: properties,
        teasers: ko.computed(function() {
            if (!selectedNode()) return [];
            var entities = ko.utils.arrayFilter(selectedNode().childNodes(), function (node) {
                return node.isTeaser();
            });
            return ko.utils.arrayMap(entities, function (entity) {
                return new TeaserViewModel(entity);
            });
        }),

        activate: function () {
            if (!isInitialized) {
                isInitialized = true;
                datacontext.fetchFirstWebsite().then(function (data) {
                    website(data.results[0]);
                    selectSiteMapVersion(website().latestSiteMap());
                })
                .fail(handleError);
            }
            attachKeyHandler();
            registerCompositionComplete();
            isActive = true;
        },

        deactivate: function () {
            detachKeyHandler();
            isActive = false;
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
            var btnOk = 'Seite löschen';
            var btnCancel = 'Abbrechen';
            app.showMessage('Soll die Seite "' + selectedNode().localeTitle('de') + '" wirklich gelöscht werden?', 'Seite löschen', [btnOk, btnCancel])
                .then(function (result) {
                    if (result === btnOk) deleteNode(selectedNode());
                });
        },

        editWebsite: function () {
            router.navigate('#website');
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

        handleKeyDown: function (e) {
            if (isActive) selectedSiteMap().tree().handleKeyDown(e);
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

    function selectedNodeChanged(newValue) {
        selectedTeaser(null);
        refreshPreview();
        showProperties(newValue);
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

    function showProperties(entity) {
        properties(null);
        if (entity) {
            properties(new NodePropertiesViewModel(entity));
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

    function deleteNode(entity) {
        var siteMapVM = selectedSiteMap();
        if (siteMapVM && entity) {
            var nextSelection = entity.nextNode() || entity.previousNode() || entity.ParentNode();
            datacontext.deleteSiteMapNode(entity).then(function () {
                siteMapVM.refreshTree();
                if (nextSelection) siteMapVM.selectNodeByKey(nextSelection.Id());
            })
            .fail(handleError);
        }
    }

    function attachKeyHandler() {
        $(window).on('keydown', vm.handleKeyDown);
    }

    function detachKeyHandler() {
        $(window).off('keydown', vm.handleKeyDown);
    }

    var $window = $(window);
    function registerCompositionComplete() {
        composition.current.complete(function () {
            $window.trigger('forceViewportHeight:refresh');
        });
    }

    /*
     * TeaserViewModel
     */
    function TeaserViewModel(entity) {
        var self = this;

        self.entity = entity;
        self.isSelected = ko.computed(function () {
            return selectedTeaser() === self;
        });

        self.selectTeaser = function () {
            selectedTeaser(self);
            showProperties(self.entity);
        }
    }

    /*
     * NodePropertiesViewModel
     */
    function NodePropertiesViewModel(entity) {
        var self = this;

        self.entity = entity;
        self.supportedTranslations = localization.website.supportedTranslations();

        self.edit = function () {
            if (entity) module.router.navigate('#sitemap/edit/' + entity.Id());
        };

        self.editTranslation = function (language) {
            if (entity) module.router.navigate('#sitemap/translate/' + entity.Id() + '/' + language.culture);
        };
        
        self.createTeaser = function () {
            if (entity) {
                var siteMapId = entity.SiteMap().Id();
                var rootNodeId = entity.SiteMap().rootNodes()[0].Id();
                publicationService.createTeaser(siteMapId, rootNodeId, entity.Id());
            }
        };

        self.canCreateTeaser = function () {
            if (entity) {
                if (entity.NodeType() == 'ROOT' || entity.hasTeasers()) return false;
                if (entity.isTeaser()) return false;
                return true;
            }
            return false;
        };

        self.deleteTeaser = function () {
            var btnOk = 'Aufmacher löschen';
            var btnCancel = 'Abbrechen';
            app.showMessage('Soll der Aufmacher "' + self.entity.localeTitle('de') + '" wirklich gelöscht werden?', 'Aufmacher löschen', [btnOk, btnCancel])
                .then(function (result) {
                    if (result === btnOk) deleteNode(self.entity);
                });
        };

        self.hasOptions = ko.computed(function () {
            return self.entity.isTeaser() || self.canCreateTeaser();
        });

        self.hasContent = ko.computed(function () {
            return entity && entity.Content();
        });

        self.contentSummary = ko.computed(function () {
            if (!entity.ContentId()) return 'Kein Inhalt festgelegt';
            var pub = entity.Content();
            if (pub) {
                return pub.EntityType() + ' #' + pub.EntityKey() + ' (v.' + pub.ContentVersion() + ')'
            }
            return '';
        });

        self.authorSummary = ko.computed(function () {
            if (!entity.ContentId() || !entity.Content()) return '';
            var pub = entity.Content();
            return pub.AuthorName() + ' ' + moment(pub.ContentDate()).fromNow();
        });

        self.selectContent = function () {
            isActive = false;
            app.selectContent({
                module: module
            }).then(function (result) {
                if (result.dialogResult) dialogConfirmed(result.selectedContent);
            }).finally(function() {
                isActive = true;
            });

            function dialogConfirmed(selectedContent) {
                publicationService.setNodeContent(self.entity.Id(), selectedContent).fail(function (error) {
                    alert(error.message);
                });
            }
        };

        self.editContent = function () {
            if (entity.ContentId() && entity.Content())
                app.editContent(entity.Content().EntityType(), entity.Content().EntityKey());
        };
    }
    
    return vm;
});