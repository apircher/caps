define([
    'plugins/dialog',
    'ko',
    '../datacontext',
    './draftSearchControl',
    'moment',
    '../contentGenerator'
],
function (dialog, ko, datacontext, DraftSearchControl, moment, contentGenerator) {

    function DraftSelectionDialog() {
        var self = this;

        self.searchControl = new DraftSearchControl();
        self.searchControl.refreshResults = function () {
            self.refresh();
        };
        self.isLoading = ko.observable();
        self.listItems = ko.observableArray();
        self.selectedItem = ko.observable();

        self.okTitle = ko.observable('Veröffentlichung erstellen');

        self.refresh();
    }

    DraftSelectionDialog.prototype.refresh = function () {
        var self = this,
            sc = self.searchControl;
        self.isLoading(true);
        return datacontext.searchDrafts(sc.searchWords(), sc.sortOptions.getOrderBy()).then(function (data) {
            var items = ko.utils.arrayMap(data.results, function (draft) { return new DraftListItem(draft, self.selectedItem); });
            self.listItems(items);
            self.isLoading(false);
        });
    };

    DraftSelectionDialog.prototype.selectOk = function () {
        var self = this;
        if (!self.selectedItem()) return;

        datacontext.getDraft(self.selectedItem().entity.Id()).then(function (data) {
            var cnt = contentGenerator.createPublicationContent(data.results[0]);
            confirmDialog(cnt);
        });

        function confirmDialog(selectedContent) {
            dialog.close(self, {
                dialogResult: true,
                selectedContent: selectedContent
            });
        }
    };

    DraftSelectionDialog.prototype.selectCancel = function () {
        dialog.close(this, {
            dialogResult: false
        });
    };

    DraftSelectionDialog.install = function () {
        require(['plugins/contentSelection'], function (contentSelection) {
            contentSelection.registerDialog('Draft', DraftSelectionDialog);
        });
    };


    function DraftListItem(entity, selection) {
        var self = this;
        self.entity = entity;

        self.createdAt = ko.computed(function () {
            return moment(self.entity.Created().At()).calendar();
        });

        self.modifiedAt = ko.computed(function () {
            return moment(self.entity.Modified().At()).fromNow();
        });

        self.isSelected = ko.computed(function () {
            return selection() === self;
        });

        self.selectItem = function () {
            selection(self);
        }
    }

    return DraftSelectionDialog;
});