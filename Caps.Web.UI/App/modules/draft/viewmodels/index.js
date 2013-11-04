﻿/*
 * draft/viewmodels/index.js
 */
define([
    '../module',
    '../datacontext',
    'ko',
    'durandal/app',
    'moment',
    'infrastructure/websiteMetadata'
],
function (module, datacontext, ko, app, moment, website) {

    var listItems = ko.observableArray(),
        selectedItem = ko.observable(),
        draftPreview = ko.observable(),
        initialized = false,
        siteInfo = website.getSiteInfo();

    app.on('caps:draft:saved', function (args) {
        var draft = args.entity;
        if (selectedItem() && selectedItem().draftId() === draft.Id())
            showPreview(selectedItem().draftId());

        if (args.isNewDraft) {
            fetchListItems().then(function () { vm.selectDraftById(draft.Id()); });            
        }
    });

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
                    template = data.results[0].deserializeTemplate();
                draftPreview(new DraftPreviewViewModel(entity, template));
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
        self.defaultCulture = siteInfo.defaultCulture();
        self.supportedTranslations = siteInfo.supportedTranslations();

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

        self.getContentTemplateName = function (templateCell) {
            var cp = self.entity().findContentPart(templateCell.name);
            if (cp) {
                if (cp.ContentType().toLowerCase() === 'html')
                    return 'CT_HTML';
                if (cp.ContentType().toLowerCase() === 'markdown')
                    return 'CT_MARKDOWN';
            }
            return 'CT_TEXT';
        };

        self.translateDraft = function (language) {
            module.router.navigate('#drafts/translate/' + entity.Id() + '/' + language.culture);
        };
    }

    DraftPreviewViewModel.prototype.getContent = function (templateCell) {
        var cp = this.entity().findContentPart(templateCell.name);
        if (cp) {
            var res = cp.getResource('de');
            if (res) return res.Content();
        }
        return '';
    };

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

    return vm;
});