/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'plugins/dialog',
    'ko',
    './fileListItem',
    'durandal/system',
    'durandal/app',
    '../datacontext',
    'infrastructure/virtualListModel',
    './fileSearchControl',
    'toastr',
    'infrastructure/urlHelper'
],
function (dialog, ko, FileListItem, system, app, datacontext, VirtualListModel, FileSearchControl, toastr, urlHelper) {
    'use strict';

    /**
     * FileSelectionDialog class
     */
    function FileSelectionDialog(options) {
        var self = this;
        options = options || {};

        self.title = options.title || 'Dateien hinzufügen';
        self.list = new VirtualListModel.VirtualList(35, null, FileListItem);
        self.isLoading = ko.observable(false);        
        self.selectedFile = self.list.selectedItem;
        self.selectedFiles = self.list.selectedItems;
        self.initialized = false;
        self.searchControl = new FileSearchControl();
        self.uploadManager = app.uploadManager;
        self.urlHelper = urlHelper;

        self.searchControl.refreshResults = function () {
            self.list.resetSelection();
            self.list.removeAll();
            self.loadPage(1);
        };

        self.activate = function () {
            console.log('Activating FileSelectionDialog');
            if (!self.initialized) {
                self.initialized = true;
                self.loadPage(1);
            }
            app.on('uploadManager:uploadStarted', uploadManager_uploadStarted);
            app.on('uploadManager:uploadDone', uploadManager_uploadDone);
        };

        self.deactivate = function () {
            console.log('Deactivating FileSelectionDialog');
            app.off('uploadManager:uploadStarted', uploadManager_uploadStarted);
            app.off('uploadManager:uploadDone', uploadManager_uploadDone);
        };

        self.loadHandler = function (element, e) {
            var firstPage = e.firstVisible.viewModel ? self.list.findItemPage(e.firstVisible.viewModel) : undefined;
            var lastPage = e.lastVisible.viewModel ? self.list.findItemPage(e.lastVisible.viewModel) : undefined;
            if (firstPage && lastPage) {
                for (var i = firstPage.index; i <= lastPage.index; i++) {
                    checkPage.call(self, i + 1);
                }
            }
            function checkPage(pageNumber) {
                var page = self.list.findPage(pageNumber);
                if (!page.isLoaded && !page.isLoading) {
                    self.list.markPageLoading(pageNumber);
                    self.loadPage(pageNumber).then(function () {
                        self.list.markPageLoaded(pageNumber);
                        e.pageLoaded(pageNumber);
                    });
                }
            }
        };

        function uploadManager_uploadStarted(file, batchIndex, storageOption) {
            var replace = storageOption === 'replace';
            if (!replace) {
                var listItem = self.list.insertItem(undefined, batchIndex);
                listItem.isUploading(true);
                listItem.tempData = file;
            }
        }

        function uploadManager_uploadDone(file, result) {
            var listItem = self.list.findItem(function (f) { return f.tempData === file || (f.data() && f.data().Id() === result.id); });
            datacontext.fetchFile(result.id).then(function () {
                listItem.data(datacontext.localGetFile(result.id));
                listItem.isUploading(false);
                listItem.isSelected(true);
            })
            .fail(function () {
                toastr.error('Die Datei ' + result.fileName + ' konnte nicht geladen werden.');
            });
        }
    }

    FileSelectionDialog.prototype.loadPage = function (pageNumber) {
        var self = this,
            sc = self.searchControl;
        return system.defer(function (dfd) {
            self.isLoading(true);
            datacontext.searchFiles(sc.searchWords(), pageNumber, self.list.itemsPerPage(), sc.sortOptions.getOrderBy(), sc.currentFilter)
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

    FileSelectionDialog.install = function () {
        require(['plugins/fileSelection'], function (fileSelection) {
            fileSelection.registerDialog(FileSelectionDialog);
        });
    };
        
    return FileSelectionDialog;
});