define(['knockout', 'durandal/system', 'durandal/app', '../module', '../datacontext', 'infrastructure/virtualListModel', 'infrastructure/filterModel', 'infrastructure/listSortModel',
    'jquery', 'toastr', 'Q', 'doubleTap', 'jquery.fileupload', 'infrastructure/tagService'
], function (ko, system, app, module, datacontext, VirtualListModel, FilterModel, SortModel, $, toastr, Q, doubleTap, fileupload, tagService) {
        
    var vm,
        initialized = false,
        list = new VirtualListModel.VirtualList(35, null, FileListItem),
        isLoading = ko.observable(false),
        uploadManager = createUploadManager(),
        selectedFile = ko.observable(),
        isInteractive = ko.observable(false),
        scrollTop = ko.observable(0),
        searchWords = ko.observable(''),
        sortOptions = createSortOptions(),
        tagFilterOptions = null,
        filterOptions = ko.observable(),
        currentFilter = '';

    module.router.on('router:navigation:attached', function (currentActivation, currentInstruction, router) {
        if (currentActivation == vm)  isInteractive(true);
    });

    app.on('caps:tags:added', function (data) {
        if (tagFilterOptions) tagFilterOptions.add(createTagFilterItem(data));
    });
    app.on('caps:tag:deleted', function (data) {
        if (tagFilterOptions) {
            var filter = tagFilterOptions.findFilter(data.Id());
            if (filter) tagFilterOptions.filters.remove(filter);
        }
    });

    vm = {
        list: list,
        isLoading: isLoading,
        uploadManager: uploadManager,
        selectedFile: selectedFile,
        scrollTop: scrollTop,
        isInteractive: isInteractive,
        searchWords: searchWords,
        sortOptions: sortOptions,
        filterOptions: filterOptions,
        selectedFiles: ko.computed(function () {
            return ko.utils.arrayFilter(list.items(), function (f) {
                return f.isSelected();
            });
        }),

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
            if (sel.length == 0)
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
            selectedFile(null);
            list.removeAll();
            loadPage(1);
        },

        beginSetFilter: function () {
            tagFilterOptions = tagFilterOptions || createTagFilterOptions();
            filterOptions(tagFilterOptions.clone());
            return true;
        },

        endSetFilter: function () {
            var filter = filterOptions().toString();
            if (filter !== currentFilter) {
                tagFilterOptions = filterOptions();
                currentFilter = filter;
                vm.refresh();
            }
            filterOptions(null);
        },

        search: function () {            
            if (searchWords() && searchWords().length) {
                if (!datacontext.isValidUserQuery(searchWords()))
                    return false;
            }
            vm.refresh();
        },
                
        resetSelectedItem: function () {
            selectedFile(null);
        },

        showSelectedFile: function () {
            this.showDetail(selectedFile());
        },

        showDetail: function (item) {
            if (item) {
                if (selectedFile() !== item)
                    selectedFile(item);
                module.router.navigate('#/files/detail/' + item.data().Id());
            }
        },

        loadHandler: function (element, e) {
            console.log('loadHandler called. First visible: ' + e.firstVisible.index + ' (Page #' + e.firstVisible.page + '); Last visible: '
                + e.lastVisible.index + ' (Page #' + e.lastVisible.page + ')');

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
        var deferred = Q.defer();
        isLoading(true);
        console.log('loadPage called. pageNumber=' + pageNumber + ', Filter=' + currentFilter);

        datacontext.searchFiles(searchWords(), pageNumber, list.itemsPerPage(), sortOptions.getOrderBy(), currentFilter)
            .then(function (data) {
                list.addPage(data, pageNumber);
                deferred.resolve();
            })
            .fail(deferred.reject)
            .done(function () {
                isLoading(false);
            });
        return deferred.promise;
    }

    function deleteFile(item) {
        return datacontext.deleteFile(item.data()).then(deleteSucceeded).fail(deleteFailed);
        function deleteSucceeded() {
            if (selectedFile() === item) selectedFile(null);
            list.removeItem(item);
        }
        function deleteFailed(err) {
            dialog.showMessage('Die Datei konnte nicht gelöscht werden.', 'Nicht erfolgreich');
        }
    }

    function createTagFilterOptions() {
        var items = ko.utils.arrayMap(tagService.tags(), function (t) { return createTagFilterItem(t); });
        return new FilterModel.FilterOptions(items);
    }

    function createSortOptions() {
        var columns = [
            new SortModel.ListColumn('Created.At', 'Hochgeladen am'),
            new SortModel.ListColumn('Created.By', 'Hochgeladen von'),
            new SortModel.ListColumn('Modified.At', 'Letzte Änderung'),
            new SortModel.ListColumn('Modified.By', 'Letzte Änderung von'),
            new SortModel.ListColumn('FileName', 'Dateiname')
        ];
        return new SortModel.SortOptions(columns, function () {
            vm.refresh();
        });
    }

    function createUploadManager() {
        return new UploadManager({
            uploadStarted: function (file, batchIndex) {
                file.listItem = list.insertItem(undefined, batchIndex);
            },
            uploadDone: function (result, file) {
                var listItem = file.listItem;
                datacontext.fetchFile(result.Id).then(function () {
                    listItem.data(datacontext.localGetFile(result.Id));
                    listItem.isUploading(false);
                })
                .fail(function (err) {
                    toastr.error('Die Datei ' + r.FileName + ' konnte nicht geladen werden.');
                });
            }
        });
    }

    function createTagFilterItem(tag) {
        return new FilterModel.FilterItem('DbFileTag', tag.Name(), tag.Id());
    }

    /**
     * FileListItem Class
     */
    function FileListItem(data) {
        var self = this;

        if (FileListItem.base)
            FileListItem.base.constructor.call(this, data);

        self.isUploading = ko.observable(false);
        self.isSelected = ko.observable(false);
        self.isSelectedItem = ko.computed(function () {
            return selectedFile() === self;
        });

        self.toggleSelected = function () {
            self.isSelected(!self.isSelected());
            if (self.isSelected()) selectedFile(self);
        };

        self.selectItem = function () {
            selectedFile(self);
        };
    }

    /**
     * UploadManager Class
     */
    function UploadManager(options) {
        var self = this;
        
        self.isUploading = ko.observable(false);
        self.progress = ko.observable(0);

        self.addFiles = function (e, data) {
            var i = 0;
            ko.utils.arrayForEach(data.files, function (f) {
                if (options.uploadStarted && typeof options.uploadStarted === 'function')
                    options.uploadStarted(f, i++);
            });
            self.isUploading(true);
            data.submit();
        };
        self.uploadDone = function (e, data) {
            ko.utils.arrayForEach(data.result, function (r) {
                var file = ko.utils.arrayFirst(data.files, function (f) { return f.name === r.FileName; });
                if (options.uploadDone && typeof options.uploadDone === 'function')
                    options.uploadDone(r, file);                
            });
            self.isUploading(false);
        };
        self.uploadFailed = function (e, data) {
            ko.utils.arrayForEach(data.files, function (f) {
                f.listItem.isUploading(false);
            });
            self.isUploading(false);
        };
        self.uploadProgress = function (e, data) {
            var p = parseInt(data.loaded / data.total * 100, 10);
            self.progress(p);
        };
        self.filesDropped = function (e, data) {
            if (e.dataTransfer.dropEffect === 'copy')
                return false;
        };
    }
            
    return vm;
});