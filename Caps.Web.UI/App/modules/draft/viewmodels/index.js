/*
 * draft/viewmodels/index.js
 */
define([
    '../module',
    '../datacontext',
    'ko',
    'durandal/app',
    'moment',
    'localization',
    'infrastructure/publicationService',
    '../contentGenerator',
    'infrastructure/listSortModel',
    '../commands/deleteDraft',
    './draftSearchControl',
    'infrastructure/interaction',
    'infrastructure/keyCode',
    'durandal/composition',
    'infrastructure/keyboardHandler',
    'infrastructure/scrollState'
],
function (module, datacontext, ko, app, moment, localization, publicationService, contentGenerator, SortModel, DeleteDraftCommand, DraftSearchControl, interaction, KeyCodes, composition, KeyboardHandler, ScrollState) {

    var listItems = ko.observableArray(),
        selectedItem = ko.observable(),
        draftPreview = ko.observable(),
        initialized = false,
        isLoading = ko.observable(false),
        deleteDraftCommand = new DeleteDraftCommand(),
        searchControl = new DraftSearchControl(),
        keyboardHandler = new KeyboardHandler(module),
        draftListScrollState = new ScrollState(module);
    
    searchControl.refreshResults = function () {
        vm.refresh();
    };

    app.on('caps:draft:saved', function (args) {
        var draft = args.entity;
        if (selectedItem() && selectedItem().draftId() === draft.Id())
            showPreview(selectedItem().draftId());

        if (args.isNewDraft) {
            fetchListItems().then(function () { vm.selectDraftById(draft.Id()); });            
        }
    });
    app.on('caps:draft:deleted', function (args) {
        fetchListItems().then(selectFirstDraft);
    });

    app.on('caps:publication:created', refetchPublicationsWhenSelected);
    app.on('caps:publication:refreshed', refetchPublicationsWhenSelected);
    
    var $window = $(window);
    module.on('module:compositionComplete', function (m, instance) {
        if (instance === vm) {
            $window.trigger('forceViewportHeight:refresh');
            draftListScrollState.activate();
        }
    });

    function refetchPublicationsWhenSelected(sitemapNode) {
        if (!sitemapNode || !selectedItem()) return;
        var content = sitemapNode.Content();
        if (content && content.EntityKey() == selectedItem().draftId())
            fetchPublications(selectedItem().draftId(), draftPreview());
    }

    function fetchListItems() {
        var sc = searchControl;
        isLoading(true);
        return datacontext.searchDrafts(sc.searchWords(), sc.sortOptions.getOrderBy()).then(function (data) {
            var items = ko.utils.arrayMap(data.results, function (draft) { return new DraftListItem(draft); });
            listItems(items);
            isLoading(false);
        });
    }

    function showPreview(draftId) {
        return datacontext.getDraft(draftId)
            .then(function (data) {
                var entity = data.results[0],
                    template = contentGenerator.createTemplateContent(data.results[0], 'de'),
                    preview = new DraftPreviewViewModel(entity, template);

                draftPreview(preview);
                fetchPublications(draftId, draftPreview());
            });
    }

    function fetchPublications(draftId, preview) {
        datacontext.fetchPublications(draftId).then(function (results) {
            preview.publications(ko.utils.arrayMap(results, function(sn) {
                return new PublicationViewModel(preview.entity(), sn);
            }));
        })
        .fail(function(error) {
            alert(error.message);
        });
    }

    function selectFirstDraft() {
        if (listItems().length) 
            vm.selectDraft(listItems()[0]);
    }

    var vm = {
        items: listItems,
        selectedItem: selectedItem,
        draftPreview: draftPreview,
        isLoading: isLoading,
        searchControl: searchControl,
        draftListScrollState: draftListScrollState,

        activate: function () {
            if (!initialized) {
                initialized = true;
                fetchListItems().then(function () {
                    selectFirstDraft();
                });
            }
            keyboardHandler.activate();
        },

        deactivate: function() {
            keyboardHandler.deactivate();
            draftListScrollState.deactivate();
        },

        addDraft: function () {
            module.router.navigate('#drafts/create');
        },

        editDraft: function (listItem) {
            module.router.navigate('#drafts/edit/' + listItem.draftId());
        },

        editSelectedDraft: function () {
            vm.editDraft(selectedItem());
        },

        selectDraft: function (listItem) {
            selectedItem(listItem);
            if (listItem) listItem.scrollIntoView();
            draftPreview(null);
            showPreview(listItem.draftId());
        },

        selectDraftById: function(id) {
            var listItem = ko.utils.arrayFirst(listItems(), function (d) { return d.draftId() === id; });
            if (listItem) vm.selectDraft(listItem);
        },

        selectNextDraft: function() {
            if (!selectedItem()) vm.selectDraft(listItems()[0]);
            else {
                var index = listItems().indexOf(selectedItem());
                if (index < listItems().length - 1)
                    vm.selectDraft(listItems()[index + 1]);
            }
        },

        selectPreviousDraft: function() {
            if (!selectedItem()) vm.selectDraft(listItems()[listItems().length - 1]);
            else {
                var index = listItems().indexOf(selectedItem());
                if (index > 0) vm.selectDraft(listItems()[index - 1]);
            }
        },

        publishDraft: function () {
            try {
                var cnt = contentGenerator.createPublicationContent(draftPreview().entity());
                draftListScrollState.deactivate();
                app.selectSiteMapNode({ module: module, okTitle: 'Veröffentlichen' }).then(function (result) {
                    if (result.dialogResult) {
                        publicationService.publish(cnt, result.selectedNode).fail(function (error) {
                            alert(error.message);
                        });
                    }
                    draftListScrollState.activate();
                });
            }
            catch (error) {
                alert(error.message);
            }
        },

        refresh: function () {
            fetchListItems();
        },

        deleteDraft: function () {
            deleteDraftCommand.execute(selectedItem().draftId());
        }
    };

    keyboardHandler.keydown = function (e) {
        var keyCode = e.keyCode;
        if (keyCode === KeyCodes.keys.UP || keyCode === KeyCodes.keys.DOWN) {
            e.preventDefault();
            if (keyCode === KeyCodes.keys.UP) vm.selectPreviousDraft();
            if (keyCode === KeyCodes.keys.DOWN) vm.selectNextDraft();
        }
    };

    /*
     * DraftPreviewViewModel class
     */
    function DraftPreviewViewModel(entity, template) {
        var self = this,
            language = new localization.Language(entity.OriginalLanguage());

        self.entity = ko.observable(entity);
        self.template = ko.observable(template);
        self.originalLanguage = language;
        self.supportedTranslations = localization.website.supportedTranslations(language.culture);
        self.publications = ko.observableArray();

        self.createdAt = ko.computed(function () {
            return moment(entity.Created().At()).format('LLLL');
        });

        self.createdFromNow = ko.computed(function () {
            return moment(entity.Created().At()).fromNow();
        });

        self.modifiedAt = ko.computed(function () {
            return moment(entity.Modified().At()).format('LLLL');
        });

        self.modifiedFromNow = ko.computed(function () {
            return moment(entity.Modified().At()).fromNow();
        });

        self.translateDraft = function (language) {
            module.router.navigate('#drafts/translate/' + entity.Id() + '/' + language.culture);
        };
    }

    /*
     * DraftListItem class
     */
    function DraftListItem(entity) {
        var self = this;

        self.draftId = ko.computed(function () {
            return entity.Id();
        });

        self.createdAt = ko.computed(function () {
            return self.formatDate(entity.Created().At());
        });

        self.modifiedAt = ko.computed(function () {
            return self.formatDate(entity.Modified().At());
        });

        self.title = ko.computed(function () {
            return entity.Name();
        });

        self.isSelected = ko.computed(function () {
            return selectedItem() && selectedItem().draftId() === self.draftId();
        });

        self.status = ko.computed(function () {
            return entity.statusTitle();
        });

        self.scrollIntoViewRequest = new interaction.InteractionRequest('ScrollIntoView');
    }

    DraftListItem.prototype.scrollIntoView = function () {
        this.scrollIntoViewRequest.trigger();
    };

    DraftListItem.prototype.formatDate = function (date) {
        return moment(date).calendar();
    };
    
    /*
     * PublicationViewModel class
     */
    function PublicationViewModel(draft, sitemapNode) {
        var self = this;

        self.draft = ko.observable(draft);
        self.sitemapNode = ko.observable(sitemapNode);

        self.title = ko.computed(function () {
            return self.sitemapNode().path();
        });

        self.contentVersion = ko.computed(function () {
            if (self.sitemapNode().Content())
                return 'v.' + self.sitemapNode().Content().ContentVersion();
            return '';
        });

        self.createdAt = ko.computed(function () {
            return moment.utc(self.sitemapNode().Created().At()).fromNow();
        });

        self.createdBy = ko.computed(function () {
            return self.sitemapNode().Created().By();
        });

        self.modifiedAt = ko.computed(function () {
            if (!self.sitemapNode().Content())
                return '';
            return moment.utc(self.sitemapNode().Content().ContentDate()).fromNow();
        });

        self.modifiedBy = ko.computed(function () {
            if (!self.sitemapNode().Content())
                return '';
            return self.sitemapNode().Content().AuthorName();
        });

        self.isOutdated = ko.computed(function () {
            if (self.sitemapNode().Content())
                return self.sitemapNode().Content().ContentVersion() < self.draft().Version();
            return false;
        });

        self.republish = function () {
            var content = contentGenerator.createPublicationContent(this.draft());
            publicationService.republish(this.sitemapNode().Id(), content);
        };
    }

    return vm;
});