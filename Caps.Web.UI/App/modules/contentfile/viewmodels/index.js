define(['knockout', 'durandal/system', 'durandal/app', '../module', '../datacontext', './virtualListModel', 'jquery', 'toastr', 'Q', 'doubleTap', 'jquery.fileupload'
], function (ko, system, app, module, datacontext, VirtualListModel, $, toastr, Q, doubleTap, fileupload) {
        
    var vm,
        initialized = false,
        list = new VirtualListModel.VirtualList(24, null, FileListItem),
        isLoading = ko.observable(false),
        isUploading = ko.observable(false),
        progress = ko.observable(0),
        selectedFile = ko.observable(),
        isInteractive = ko.observable(false),
        scrollTop = ko.observable(0),
        searchWords = ko.observable('');

    module.router.on('router:navigation:attached', function (currentActivation, currentInstruction, router) {
        if (currentActivation == vm)  isInteractive(true);
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

        selectedFiles: ko.computed(function () {
            return ko.utils.arrayFilter(list.items(), function (f) {
                return f.isSelected();
            });
        }),

        startUpload: function (e, data) {
            ko.utils.arrayForEach(data.files, function (f) {
                var item = list.addItem();
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
            app.showMessage('Sollen die ' + this.selectedFiles().length + ' ausgewählten Dateien wirklich endgültig gelöscht werden?', 'Auswahl löschen', [btnOk, 'Abbrechen'])
                .then(function (result) {
                    if (result === btnOk) deleteSelection();
                });
        },

        refresh: function () {
            scrollTop(0);
            selectedFile(null);
            list.removeAll();
            loadPage(1);
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

            for (var i = e.firstVisible.page; i <= e.lastVisible.page; i++) 
                checkPage(i + 1);

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
        datacontext.searchFiles(searchWords(), pageNumber, list.itemsPerPage())
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
        datacontext.deleteFile(item.data()).then(deleteSucceeded).fail(deleteFailed);
        function deleteSucceeded() {
            list.remove(item);
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

    return vm;
});