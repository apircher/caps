define([
    'knockout', 'durandal/app', '../module', '../datacontext', 'jquery', 'toastr', 'Q', 'doubleTap', 'jquery.fileupload'
], function (ko, app, module, datacontext, $, toastr, Q, doubleTap) {
        
    var vm,
        initialized = false,
        searchResult = ko.observable(new SearchResult()),
        itemsPerPage = ko.observable(20),
        isLoading = ko.observable(false),
        isUploading = ko.observable(false),
        progress = ko.observable(0),
        selectedFile = ko.observable(),
        isInteractive = ko.observable(false),
        lastScrollTop = 0;

    module.router.on('router:navigation:attached', function (currentActivation, currentInstruction, router) {
        if (currentActivation == vm) {
            //scrollToSelectedFile();
            restoreScrollTop();
            isInteractive(true);
        }
    });

    vm = {
        searchResult: searchResult,
        isLoading: isLoading,
        isUploading: isUploading,
        progress: progress,
        selectedFile: selectedFile,

        selectedFiles: ko.computed(function () {
            return ko.utils.arrayFilter(searchResult().items(), function (f) {
                return f.isSelected();
            });
        }),

        loadMoreItems: loadMoreItems,

        startUpload: function (e, data) {
            ko.utils.arrayForEach(data.files, function (f) {
                var listItem = new FileListItem();
                f.listItem = listItem;
                listItem.isUploading(true);
                searchResult().items.push(listItem);
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
                getFiles(itemsPerPage());
            }
        },

        deactivate: function () {
            isInteractive(false);
            saveScrollTop();
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
            lastScrollTop = 0;
            selectedFile(null);
            files.removeAll();
            getFiles(itemsPerPage());
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

        hasMorePages: ko.computed(function () {
            return isInteractive() && searchResult().hasMorePages();
        })

    };
    
    function getFiles(itemsPerPage) {
        var deferred = Q.defer();
        isLoading(true);
        datacontext.searchFiles(1, itemsPerPage)
            .then(function (data) {
                
                var sr = new SearchResult(data, 1, itemsPerPage);
                searchResult(sr);

                deferred.resolve();
            })
            .fail(deferred.reject)
            .done(function () {
                isLoading(false);
            });
        return deferred.promise;
    }

    function loadMoreItems() {
        var deferred = Q.defer(),
            sr = searchResult(),
            page = sr.currentPage() + 1;
        isLoading(true);
        datacontext.searchFiles(page, sr.itemsPerPage())
            .then(function (data) {
                sr.addPage(data, page);
                deferred.resolve();
            })
            .fail(deferred.reject)
            .done(function () {
                isLoading(false);
            });
        return deferred.promise;
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

    function scrollToSelectedFile() {
        if (selectedFile()) {
            $.each($('#files-list > li'), function (index, item) {
                if (ko.dataFor(item) === selectedFile()) {
                    var offset = $(item).offset();
                    $('html, body').scrollTop(offset.top - 70);
                    return false;
                }
            });
        }
    }

    function saveScrollTop() {
        lastScrollTop = $('html, body').scrollTop();
    }
    function restoreScrollTop() {
        $('html, body').scrollTop(lastScrollTop);
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

    /**
     * SearchResult Class
     */
    function SearchResult(data, currentPage, itemsPerPage) {
        var self = this;
        this.items = ko.observableArray();
        this.currentPage = ko.observable(currentPage || 1);
        this.itemsPerPage = ko.observable(itemsPerPage || 10);
        this.totalCount = ko.observable(0);
        this.totalPages = ko.computed(function () {
            return Math.ceil(self.totalCount() / self.itemsPerPage());
        });
        this.hasMorePages = ko.computed(function () {
            return self.currentPage() < self.totalPages();
        });

        if (data) this.addPage(data, this.currentPage());
    }

    SearchResult.prototype._addItems = function (results) {
        var self = this;
        var listItems = ko.utils.arrayMap(results, function (item) {
            return new FileListItem(item);
        });
        ko.utils.arrayForEach(listItems, function (item) {
            self.items.push(item);
        });
    };

    SearchResult.prototype.addPage = function (data, pageNumber) {
        this.currentPage(pageNumber);
        this._addItems(data.results);
        if (data.inlineCount)
            this.totalCount(data.inlineCount);
    };

    return vm;
});