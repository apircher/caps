define([
    'ko',
    'durandal/system',
    'durandal/app',
    '../module',
    '../datacontext',
    'infrastructure/virtualListModel',
    'infrastructure/filterModel',
    'infrastructure/listSortModel',
    'jquery',
    'toastr',
    'Q',
    'doubleTap',
    'infrastructure/tagService',
    './fileListItem',
    './uploadManager',
    './fileSearchControl',
    'infrastructure/serverUtil',
    './fileUploadDialog'
],
function (ko, system, app, module, datacontext, VirtualListModel, FilterModel, SortModel, $, toastr, Q, doubleTap, tagService, FileListItem, UploadManager, FileSearchControl, server, FileUploadDialog) {
        
    var vm,
        initialized = false,
        list = new VirtualListModel.VirtualList(35, null, FileListItem),
        isLoading = ko.observable(false),
        uploadManager = createUploadManager(),
        isInteractive = ko.observable(false),
        scrollTop = ko.observable(0),
        searchControl = new FileSearchControl();

    module.router.on('router:navigation:attached', function (currentActivation) {
        if (currentActivation == vm)  isInteractive(true);
    });

    app.on('caps:tags:added', function (data) {
        searchControl.addTagFilter(data);
    });

    app.on('caps:tag:deleted', function (data) {
        searchControl.removeTagFilter(data);
    });

    app.on('caps:file:deleted', function (data) {
        var li = list.findItem(function (i) { return i.data().Id() == data.Id(); });
        if (li) {
            if (list.selectedItem() === li) list.resetSelection();
            list.removeItem(li);
        }
    });

    searchControl.refreshResults = function () {
        vm.refresh();
    };

    vm = {
        list: list,
        isLoading: isLoading,
        uploadManager: uploadManager,
        selectedFile: list.selectedItem,
        selectedFiles: list.selectedItems,
        scrollTop: scrollTop,
        isInteractive: isInteractive,
        searchControl: searchControl,
        server: server,

        activate: function () {
            if (!initialized) {
                initialized = true;
                loadPage(1);
            }
        },

        deactivate: function () {
            isInteractive(false);
        },

        deleteFile: function (item) {
            var btnOk = 'Datei löschen';
            var btnCancel = 'Abbrechen';
            app.showMessage('Soll die Datei ' + item.data().FileName() + ' wirklich gelöscht werden?', 'Datei löschen', [btnOk, btnCancel])
                .then(function (result) {
                    if (result === btnOk) deleteFile(item);
                });
        },

        deleteSelection: function () {
            var sel = this.selectedFiles();
            if (sel.length === 0)
                return;
            if (sel.length == 1)
                return this.deleteFile(sel[0]);

            var btnOk = 'Auswahl löschen';
            app.showMessage('Sollen die ' + sel.length + ' ausgewählten Dateien wirklich endgültig gelöscht werden?', 'Auswahl löschen', [btnOk, 'Abbrechen'])
                .then(function (result) {
                    if (result === btnOk) {
                        list.suspendEvents = true;
                        var promises = ko.utils.arrayMap(sel, function (f) { return deleteFile(f); });
                        Q.all(promises).then(function () {
                            list.suspendEvents = false;
                            list.raiseItemsChanged();
                        });
                    }
                });
        },

        refresh: function () {
            scrollTop(0);
            list.resetSelection();
            list.removeAll();
            loadPage(1);
        },
                
        resetSelectedItem: function () {
            list.resetSelection();
        },

        showSelectedFile: function () {
            this.showDetail(list.selectedItem());
        },

        showDetail: function (item) {
            if (item) {
                list.selectItem(item);
                module.router.navigate('#files/detail/' + item.data().Id());
            }
        },

        loadHandler: function (element, e) {
            console.log('loadHandler called. First visible: ' + e.firstVisible.index + ' (Page #' + e.firstVisible.page + '); Last visible: ' +
                e.lastVisible.index + ' (Page #' + e.lastVisible.page + ')');

            if (!isInteractive()) return;

            var firstPage = e.firstVisible.viewModel ? list.findItemPage(e.firstVisible.viewModel) : undefined;
            var lastPage = e.lastVisible.viewModel ? list.findItemPage(e.lastVisible.viewModel) : undefined;
            if (firstPage && lastPage) {
                for (var i = firstPage.index; i <= lastPage.index; i++) {
                    checkPage(i + 1);
                }
            }

            function checkPage(pageNumber) {
                var page = list.findPage(pageNumber);
                if (!page.isLoaded && !page.isLoading) {
                    list.markPageLoading(pageNumber);
                    loadPage(pageNumber).then(function () {
                        list.markPageLoaded(pageNumber);
                        e.pageLoaded(pageNumber);
                    });
                }
            }
        }
    };

    function loadPage(pageNumber) {
        var sc = searchControl;
        console.log('loadPage called. pageNumber=' + pageNumber + ', Filter=' + sc.currentFilter);
        return system.defer(function (dfd) {
            isLoading(true);
            datacontext.searchFiles(sc.searchWords(), pageNumber, list.itemsPerPage(), sc.sortOptions.getOrderBy(), sc.currentFilter)
                .then(function (data) {
                    list.addPage(data, pageNumber);
                    dfd.resolve();
                })
                .fail(dfd.reject)
                .done(function () {
                    isLoading(false);
                });
        }).promise();
    }

    function deleteFile(item) {
        return datacontext.deleteFile(item.data()).then(deleteSucceeded).fail(deleteFailed);
        function deleteSucceeded() {
            if (list.selectedItem() === item) list.resetSelection();
            list.removeItem(item);
        }
        function deleteFailed(err) {
            dialog.showMessage('Die Datei konnte nicht gelöscht werden.', 'Nicht erfolgreich');
        }
    }

    function createUploadManager() {
        return new UploadManager({
            beforeUpload: function(files, data, callback) {
                var fileNames = ko.utils.arrayMap(files, function (f) { return f.name; });
                datacontext.getFileInfo(fileNames).then(function (result) {
                    var existingFiles = ko.utils.arrayFilter(result, function (r) { return r.Count > 0; });
                    if (existingFiles.length > 0) {
                        var dlgVm = new FileUploadDialog(result);
                        app.showDialog(dlgVm).then(function (dialogResult) {
                            if (dialogResult) 
                                callback(dialogResult);
                        });
                    }
                    else
                        callback();
                });
            },
            uploadStarted: function (file, batchIndex, storageOptions) {
                var replace = storageOptions && storageOptions.storageAction === 'replace';
                if (!replace) {
                    file.listItem = list.insertItem(undefined, batchIndex);
                    file.listItem.isUploading(true);
                }
            },
            uploadDone: function (result, file) {
                var listItem = file.listItem || list.findItem(function (f) { return f.data() && f.data().Id() === result.Id; });
                datacontext.fetchFile(result.Id).then(function () {
                    if (listItem) {
                        listItem.data(datacontext.localGetFile(result.Id));
                        listItem.isUploading(false);
                    }
                })
                .fail(function (err) {
                    toastr.error('Die Datei ' + r.FileName + ' konnte nicht geladen werden.');
                });
            }
        });
    }
                
    return vm;
});