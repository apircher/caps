define(['knockout', 'durandal/system', 'durandal/app', '../module', '../datacontext', 'infrastructure/virtualListModel', 'jquery', 'toastr', 'Q', 'doubleTap', 'jquery.fileupload', 'infrastructure/tagService'
], function (ko, system, app, module, datacontext, VirtualListModel, $, toastr, Q, doubleTap, fileupload, tagService) {
        
    var vm,
        initialized = false,
        list = new VirtualListModel.VirtualList(20, null, FileListItem),
        isLoading = ko.observable(false),
        isUploading = ko.observable(false),
        progress = ko.observable(0),
        selectedFile = ko.observable(),
        isInteractive = ko.observable(false),
        scrollTop = ko.observable(0),
        searchWords = ko.observable(''),
        sortOptions = new SortOptions(),
        filterOptions = new FilterOptions(),
        lastFilter = '';

    module.router.on('router:navigation:attached', function (currentActivation, currentInstruction, router) {
        if (currentActivation == vm)  isInteractive(true);
    });

    app.on('caps:tag:added', function (data) {
        refreshTags();
    });

    vm = {
        list: list,
        isLoading: isLoading,
        isUploading: isUploading,
        progress: progress,
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

        startUpload: function (e, data) {
            var i = 0;
            ko.utils.arrayForEach(data.files, function (f) {
                var item = list.insertItem(undefined, i++);
                f.listItem = item;
            });                        
            isUploading(true);
            data.submit();
        },

        uploadDone: function (e, data) {
            ko.utils.arrayForEach(data.result, function (r) {

                var file = ko.utils.arrayFirst(data.files, function (f) { return f.name === r.FileName; });
                var item = file.listItem;

                datacontext.fetchFile(r.Id).then(function () {
                    item.data(datacontext.localGetFile(r.Id));
                    item.isUploading(false);
                })
                .fail(function (err) {
                    toastr.error('Die Datei ' + r.FileName + ' konnte nicht geladen werden.');
                });
            });

            isUploading(false);
        },

        uploadFailed: function (e, data) {
            ko.utils.arrayForEach(data.files, function (f) {
                f.listItem.isUploading(false);
            });

            isUploading(false);
        },

        uploadProgress: function (e, data) {
            var p = parseInt(data.loaded / data.total * 100, 10);
            progress(p);
        },

        filesDropped: function(e, data) {            
            if (e.dataTransfer.dropEffect === 'copy')
                return false;
        },

        activate: function () {
            if (!initialized) {
                initialized = true;
                refreshTags();
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

        endSetFilter: function () {
            var s = filterOptions.toString();
            if (s !== lastFilter) vm.refresh();
        },

        search: function () {            
            if (searchWords() && searchWords().length) {
                if (!datacontext.isValidUserQuery(searchWords()))
                    return false;
            }
            vm.refresh();
        },

        toggleSortDirection: function () {
            vm.setSortDirection(sortOptions.sortDirection() == 'desc' ? 'asc' : 'desc');
        },

        sortAsc: function () { vm.setSortDirection('asc'); },
        sortDesc: function () { vm.setSortDirection('desc'); },

        setSortDirection: function (dir) {
            sortOptions.sortDirection(dir);
            vm.refresh();
        },

        sortBy: function (column) {
            sortOptions.selectedColumn(column);
            vm.refresh();
        },

        resetSelectedItem: function () {
            selectedFile(null);
        },

        navigateToSelectedFile: function () {
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
        console.log('loadPage called. pageNumber=' + pageNumber);

        lastFilter = filterOptions.toString();
        datacontext.searchFiles(searchWords(), pageNumber, list.itemsPerPage(), sortOptions.getOrderBy(), lastFilter)
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

    function createTagFilterItems(data) {
        for (var i = 0; i < data.length; i++) {
            filterOptions.createOrUpdateFilter(data[i].Name(), 'DbFileTag', data[i].Id());
        }
    }

    function refreshTags() {
        createTagFilterItems(tagService.tags());
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
     * ListColumn Class
     */
    function ListColumn(name, title, owner) {
        var self = this;
        self.name = name;
        self.title = title;
        self.owner = owner;

        self.sort = function () {
            owner.selectedColumn(self);
            vm.refresh();
        };

        self.isSelected = ko.computed(function () {
            return owner.selectedColumn() === self;
        });
    }

    /**
     * SortOptions Class
     */
    function SortOptions() {
        var self = this;

        self.selectedColumn = ko.observable();
        self.sortDirection = ko.observable('desc');

        self.columns = [
            new ListColumn('Created.At', 'Hochgeladen am', this),
            new ListColumn('Created.By', 'Hochgeladen von', this),
            new ListColumn('Modified.At', 'Letzte Änderung', this),
            new ListColumn('Modified.By', 'Letzte Änderung von', this),
            new ListColumn('FileName', 'Dateiname', this)
        ];

        self.selectedColumn(self.columns[0]);
    }

    SortOptions.prototype.getOrderBy = function () {
        var col = this.selectedColumn();
        if (col) {
            var result = col.name || 'Created.At';
            if (this.sortDirection() && this.sortDirection().toLowerCase() === 'desc')
                result += ' desc';
        }
        return result;
    };

    /**
     * FilterItem Class
     */
    function FilterItem(filterName, filterTitle, filterValue) {
        var self = this;
        self.title = filterTitle;
        self.name = filterName;
        self.value = filterValue;
        self.isSelected = ko.observable(false);

        self.toggleSelect = function () {
            self.isSelected(!self.isSelected());
        };
    }

    /**
     * FilterOptions Class
     */
    function FilterOptions() {
        var self = this;
        self.filters = ko.observableArray([]);
        self.selectedFilters = ko.computed(function () {
            return ko.utils.arrayFilter(self.filters(), function (item) {
                return item.isSelected();
            });
        });

        self.clear = function () {
            self.filters([]);
        };
        self.reset = function () {
            ko.utils.arrayForEach(self.selectedFilters(), function (item) {
                item.isSelected(false);
            });
        };
    }

    FilterOptions.prototype.createOrUpdateFilter = function (title, name, value) {
        var item = this.findFilter(value);
        if (!item) {
            item = new FilterItem(name, title, value);
            this.filters.push(item);
        }
        else {
            item.title = title;
            item.value = value;
        }
    };

    FilterOptions.prototype.findFilter = function (value) {
        return ko.utils.arrayFirst(this.filters(), function (item) {
            return item.value === value;
        });
    };

    FilterOptions.prototype.toString = function () {
        var items = this.selectedFilters();
        var result = '';
        for (var i = 0; i < items.length; i++) {
            result += items[i].value + (i < items.length -1 ? '|' : '');
        }
        return result;
    };

    return vm;
});