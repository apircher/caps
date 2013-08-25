define(['knockout', 'durandal/system', 'durandal/app', '../module', '../datacontext', 'jquery', 'toastr', 'Q', 'doubleTap', 'jquery.fileupload'
], function (ko, system, app, module, datacontext, $, toastr, Q, doubleTap) {
        
    var vm,
        initialized = false,
        listItems = ko.observableArray([]),
        searchResult = ko.observable(new SearchResult()),
        itemsPerPage = ko.observable(24),
        isLoading = ko.observable(false),
        isUploading = ko.observable(false),
        progress = ko.observable(0),
        selectedFile = ko.observable(),
        isInteractive = ko.observable(false),
        scrollTop = ko.observable(0);

    module.router.on('router:navigation:attached', function (currentActivation, currentInstruction, router) {
        if (currentActivation == vm)  isInteractive(true);
    });

    vm = {
        searchResult: searchResult,
        itemsPerPage: itemsPerPage,
        listItems: listItems,
        isLoading: isLoading,
        isUploading: isUploading,
        progress: progress,
        selectedFile: selectedFile,
        scrollTop: scrollTop,
        isInteractive: isInteractive,

        selectedFiles: ko.computed(function () {
            return ko.utils.arrayFilter(listItems(), function (f) {
                return f.isSelected();
            });
        }),

        startUpload: function (e, data) {
            ko.utils.arrayForEach(data.files, function (f) {
                var listItem = new FileListItem();
                f.listItem = listItem;
                listItem.isUploading(true);
                listItems.push(listItem);
            });
                        
            isUploading(true);
            data.submit();
        },

        uploadDone: function (e, data) {
            ko.utils.arrayForEach(data.result, function (r) {

                var file = ko.utils.arrayFirst(data.files, function (f) { return f.name === r.FileName; });
                var listItem = file.listItem;

                datacontext.fetchFile(r.Id).then(function () {
                    listItem.data(datacontext.localGetFile(r.Id));
                    listItem.isUploading(false);
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
                search(itemsPerPage());
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
            app.showMessage('Sollen die ' + this.selectedFiles().length + ' ausgewählten Dateien wirklich endgültig gelöscht werden?', 'Auswahl löschen', [btnOk, 'Abbrechen'])
                .then(function (result) {
                    if (result === btnOk) deleteSelection();
                });
        },

        refresh: function () {
            scrollTop(0);
            selectedFile(null);
            listItems.removeAll();
            search(itemsPerPage());
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

            for (var i = e.firstVisible.page; i <= e.lastVisible.page; i++) 
                checkPage(i + 1);

            function checkPage(pageNumber) {
                var page = searchResult().findPage(pageNumber);
                if (!page.isLoaded && !page.isLoading) {
                    searchResult().markPageLoading(pageNumber);
                    loadPage(pageNumber).then(function () {
                        searchResult().markPageLoaded(pageNumber);
                        e.pageLoaded(pageNumber);
                    });
                }
            }
        }
    };
    
    function search(itemsPerPage) {
        var deferred = Q.defer();
        isLoading(true);
        var filters = searchFilters();
        datacontext.searchFiles(1, itemsPerPage, filters)
            .then(function (data) {                
                var sr = new SearchResult(itemsPerPage, filters, data);
                searchResult(sr);
                buildListItems();
                deferred.resolve();
            })
            .fail(deferred.reject)
            .done(function () {
                isLoading(false);
            });
        return deferred.promise;
    }

    function loadPage(pageNumber) {
        var deferred = Q.defer(),
            sr = searchResult();
        isLoading(true);
        console.log('loadPage called. pageNumber=' + pageNumber);
        datacontext.searchFiles(pageNumber, sr.itemsPerPage(), sr.filters)
            .then(function (data) {
                sr.addPage(data, pageNumber);
                updateListItems();
                deferred.resolve();
            })
            .fail(deferred.reject)
            .done(function () {
                isLoading(false);
            });
        return deferred.promise;
    }

    function buildListItems() {
        var items = [];
        for (var i = 0; i < searchResult().pages.length; i++) {
            var page = searchResult().pages[i];
            for (var j = 0; j < page.count; j++) {
                var item = new FileListItem();
                if (page.isLoaded) 
                    item.setData(page.items[j]);
                items.push(item);
            }
        }
        listItems(items);
    }

    function updateListItems() {
        for (var i = 0, x = 0; i < searchResult().pages.length; i++) {
            var page = searchResult().pages[i];
            if (page.isLoaded) {
                for (var j = 0; j < page.count; j++) {
                    var item = listItems()[x++];
                    var data = page.items ? page.items[j] : null;
                    if (data && item.data() !== data) item.setData(data);
                }
            }
            else x += page.count;
        }
    }

    function searchFilters() {
        return [];
    }

    function deleteFile(item) {
        datacontext.deleteFile(item.data()).then(deleteSucceeded).fail(deleteFailed);
        function deleteSucceeded() {
            searchResult().items.remove(item);
            if (selectedFile() === item)
                selectedFile(null);
        }
        function deleteFailed(err) {
            dialog.showMessage('Die Datei konnte nicht gelöscht werden.', 'Nicht erfolgreich');
        }
    }

    function deleteSelection() {
        ko.utils.arrayForEach(vm.selectedFiles(), function (f) {
            deleteFile(f);
        });
    }


    /**
     * FileListItem Class
     */
    function FileListItem(data) {
        var self = this;
        self.data = ko.observable(data);
        self.isUploading = ko.observable(false);
        self.isSelected = ko.observable(false);
        self.isSelectedItem = ko.computed(function () {
            return selectedFile() === self;
        });
    }

    FileListItem.prototype.toggleSelected = function () {
        this.isSelected(!this.isSelected());
    };

    FileListItem.prototype.selectItem = function () {
        selectedFile(this);
    };

    FileListItem.prototype.setData = function (data) {
        this.data(data);
    };

    /**
     * SearchResult Class
     */
    function SearchResult(itemsPerPage, filters, data) {
        var self = this;

        self.filters = filters;
        self.pages = [];
        self.itemsPerPage = ko.observable(itemsPerPage || 10);
        self.totalCount = ko.observable(0);

        this.totalPages = ko.computed(function () {
            return Math.ceil(self.totalCount() / self.itemsPerPage());
        });

        if (data) this.addPage(data, 1);
    }

    SearchResult.prototype._addItems = function (results, index) {
        var self = this;
        var page = new SearchResultPage(index, results);
        page.isLoaded = true;
        self.pages[index] = page;
    };

    SearchResult.prototype._buildDummyPages = function (totalCount, itemsPerPage) {
        var self = this,
            numPages = self.totalPages(),
            numItems = self.totalCount(),
            dummyPages = [];

        for (var i = 0; i < numPages; i++) {
            var numItems = (i < numPages - 1) ? itemsPerPage : totalCount - (i * itemsPerPage),
                dummy = new SearchResultPage(i);
            dummy.count = numItems;
            dummyPages.push(dummy);
        }
        self.pages = dummyPages;
    };

    SearchResult.prototype.addPage = function (data, pageNumber) {
        if (data.inlineCount && data.inlineCount != this.totalCount()) {
            this.totalCount(data.inlineCount);
            this._buildDummyPages(data.inlineCount, this.itemsPerPage());
        }
        this._addItems(data.results, pageNumber -1);
    };

    SearchResult.prototype.findPage = function (pageNumber) {
        if (this.pages.length <= 0 || this.pages.length < pageNumber)
            return null;
        return this.pages[pageNumber - 1];
    };

    SearchResult.prototype.isPageLoaded = function (pageNumber) {
        var page = this.findPage(pageNumber);
        return page ? page.isLoaded : false;
    };

    SearchResult.prototype.isPageLoading = function (pageNumber) {
        var page = this.findPage(pageNumber);
        return page ? page.isLoading : false;
    };

    SearchResult.prototype.markPageLoading = function (pageNumber) {
        var page = this.findPage(pageNumber);
        if (page) page.isLoading = true;
    };

    SearchResult.prototype.markPageLoaded = function (pageNumber) {
        var page = this.findPage(pageNumber);
        if (page) {
            page.isLoading = false;
            page.isLoaded = true;
        }
    };

    /**
     * SearchResultPage Class
     */
    function SearchResultPage(index, items) {
        var self = this;
        self.index = index;
        self.items = items;
        self.count = items ? items.length : 0;

        self.isLoaded = false;
        self.isLoading = false;
    }

    return vm;
});