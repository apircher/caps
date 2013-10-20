﻿define(['plugins/fileSelection', 'plugins/dialog', 'ko', './fileListItem', 'durandal/system', '../datacontext', 'infrastructure/virtualListModel'
], function (fileSelection, dialog, ko, FileListItem, system, datacontext, VirtualListModel) {

    function FileSelectionDialog() {
        var self = this;

        self.list = new VirtualListModel.VirtualList(35, null, FileListItem);
        self.isLoading = ko.observable(false);        
        self.selectedFile = self.list.selectedItem;
        self.selectedFiles = self.list.selectedItems;
        self.initialized = false;
    }

    FileSelectionDialog.prototype.activate = function () {
        if (!this.initialized) {
            this.initialized = true;
            this.loadPage(1);
        }
    };

    FileSelectionDialog.prototype.loadPage = function (pageNumber) {
        var self = this;
        return system.defer(function (dfd) {
            self.isLoading(true);
            datacontext.searchFiles('', pageNumber, self.list.itemsPerPage(), '', '')
                .then(function (data) {
                    self.list.addPage(data, pageNumber);
                    dfd.resolve();
                })
                .fail(dfd.reject)
                .done(function () {
                    self.isLoading(false);
                });
        }).promise();
    };

    FileSelectionDialog.prototype.loadHandler = function (element, e) {
        var firstPage = e.firstVisible.viewModel ? this.list.findItemPage(e.firstVisible.viewModel) : undefined;
        var lastPage = e.lastVisible.viewModel ? this.list.findItemPage(e.lastVisible.viewModel) : undefined;
        if (firstPage && lastPage) {
            for (var i = firstPage.index; i <= lastPage.index; i++) {
                checkPage.call(this, i + 1);
            }
        }
        function checkPage(pageNumber) {
            var page = this.list.findPage(pageNumber);
            if (!page.isLoaded && !page.isLoading) {
                this.list.markPageLoading(pageNumber);
                loadPage(pageNumber).then(function () {
                    this.list.markPageLoaded(pageNumber);
                    e.pageLoaded(pageNumber);
                });
            }
        }
    };

    FileSelectionDialog.prototype.selectOk = function () {
        var selection = ko.utils.arrayMap(this.selectedFiles(), function (f) {
            return f.data();
        });
        if (!selection.length && this.selectedFile()) selection.push(this.selectedFile().data());

        dialog.close(this, {
            dialogResult: true,
            selectedFiles: selection
        });
    };

    FileSelectionDialog.prototype.selectCancel = function () {
        dialog.close(this, {
            dialogResult: false
        });
    };

    fileSelection.registerDialog(FileSelectionDialog);
    
    return FileSelectionDialog;
});