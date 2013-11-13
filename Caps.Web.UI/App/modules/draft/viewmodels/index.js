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
    '../contentGenerator'
],
function (module, datacontext, ko, app, moment, localization, publicationService, contentGenerator) {

    var listItems = ko.observableArray(),
        selectedItem = ko.observable(),
        draftPreview = ko.observable(),
        initialized = false;

    app.on('caps:draft:saved', function (args) {
        var draft = args.entity;
        if (selectedItem() && selectedItem().draftId() === draft.Id())
            showPreview(selectedItem().draftId());

        if (args.isNewDraft) {
            fetchListItems().then(function () { vm.selectDraftById(draft.Id()); });            
        }
    });

    app.on('caps:publication:created', refetchPublicationsWhenSelected);
    app.on('caps:publication:refreshed', refetchPublicationsWhenSelected);

    function refetchPublicationsWhenSelected(sitemapNode) {
        if (!sitemapNode || !selectedItem()) return;
        var content = sitemapNode.Content();
        if (content && content.EntityKey() == selectedItem().draftId())
            fetchPublications(selectedItem().draftId(), draftPreview());
    }

    function fetchListItems() {
        return datacontext.getDrafts().then(function (data) {
            var items = ko.utils.arrayMap(data.results, function (draft) { return new DraftListItem(draft); });
            listItems(items);
        });
    }

    function showPreview(draftId) {
        return datacontext.getDraft(draftId)
            .then(function (data) {
                var entity = data.results[0],
                    template = contentGenerator.createTemplateContent(data.results[0], 'de'),
                    preview = new DraftPreviewViewModel(entity, template);

                draftPreview(preview);
                fetchPublications(draftId, preview);
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

        activate: function () {
            if (!initialized) {
                initialized = true;
                fetchListItems().then(selectFirstDraft);
            }
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
            draftPreview(null);
            showPreview(listItem.draftId());
        },

        selectDraftById: function(id) {
            var listItem = ko.utils.arrayFirst(listItems(), function (d) { return d.draftId() === id; });
            if (listItem) vm.selectDraft(listItem);
        },

        publishDraft: function () {
            try {
                var cnt = contentGenerator.createPublicationContent(draftPreview().entity());
                app.selectSiteMapNode({ module: module }).then(function (result) {
                    if (result.dialogResult) {
                        publicationService.publish(cnt, result.selectedNode).fail(function (error) {
                            alert(error.message);
                        });
                    }
                });
            }
            catch (error) {
                alert(error.message);
            }
        }
    };

    /*
     * DraftPreviewViewModel class
     */
    function DraftPreviewViewModel(entity, template) {
        var self = this;
        self.entity = ko.observable(entity);
        self.resource = ko.observable(entity.getResource('de'));
        self.template = ko.observable(template);
        self.defaultCulture = localization.website.defaultLanguage;
        self.supportedTranslations = localization.website.supportedTranslations();
        self.publications = ko.observableArray();

        self.createdAt = ko.computed(function () {
            return moment.utc(entity.Created().At()).format('LLLL');
        });

        self.createdFromNow = ko.computed(function () {
            return moment.utc(entity.Created().At()).fromNow();
        });

        self.modifiedAt = ko.computed(function () {
            return moment.utc(entity.Modified().At()).format('LLLL');
        });

        self.modifiedFromNow = ko.computed(function () {
            return moment.utc(entity.Modified().At()).fromNow();
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

        self.title = ko.computed(function () {
            return entity.Name();
        });

        self.isSelected = ko.computed(function () {
            return selectedItem() === self;
        });
    }

    DraftListItem.prototype.formatDate = function (date) {
        var now = moment();
        var d = moment.utc(date);

        var diffDays = d.diff(now, 'days');
        if (diffDays < 7) {
            return d.format('dd HH:mm');
        }

        if (d.year() == now.year()) {
            return d.format('dd. D.MMM HH:mm');
        }

        return d.format('D.MMM YY HH:mm');
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