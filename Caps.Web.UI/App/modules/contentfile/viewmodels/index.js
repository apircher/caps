define([
    'knockout', '../module', '../datacontext', 'jquery', 'toastr', 'plugins/dialog', 'Q', 'doubleTap', 'jquery.fileupload'
], function (ko, module, datacontext, $, toastr, dialog, Q, doubleTap) {
        
    var vm,
        initialized = false,
        files = ko.observableArray([]),
        isLoading = ko.observable(false),
        isUploading = ko.observable(false),
        progress = ko.observable(0),
        selectedFile = ko.observable();

    module.router.on('router:navigation:attached', function (currentActivation, currentInstruction, router) {
        if (currentActivation == vm) {
            scrollToSelectedFile();
        }
    });

    vm = {
        files: files,
        isLoading: isLoading,
        isUploading: isUploading,
        progress: progress,
        selectedFile: selectedFile,

        selectedFiles: ko.computed(function () {
            return ko.utils.arrayFilter(files(), function (f) {
                return f.isSelected();
            });
        }),

        startUpload: function (e, data) {
            ko.utils.arrayForEach(data.files, function (f) {
                var listItem = new FileListItem();
                f.listItem = listItem;
                listItem.isUploading(true);
                files.push(listItem);
            });
                        
            isUploading(true);
            data.submit();
        },

        uploadDone: function (e, data) {
            ko.utils.arrayForEach(data.result, function (r) {

                var file = ko.utils.arrayFirst(data.files, function (f) { return f.name === r.FileName; });
                var listItem = file.listItem;

                datacontext.fetchFile(r.Id).then(function () {
                    //files.push(datacontext.localGetFile(r.Id));
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
                getFiles();
            }
        },

        deleteFile: function (item) {
            var btnOk = 'Datei löschen';
            var btnCancel = 'Abbrechen';
            dialog.showMessage('Soll die Datei ' + item.data().FileName() + ' wirklich gelöscht werden?', 'Datei löschen', [btnOk, btnCancel])
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
            dialog.showMessage('Sollen die ' + this.selectedFiles().length + ' ausgewählten Dateien wirklich endgültig gelöscht werden?', 'Auswahl löschen', [btnOk, 'Abbrechen'])
                .then(function (result) {
                    if (result === btnOk) deleteSelection();
                });
        },

        refresh: function () {
            selectedFile(null);
            files.removeAll();
            getFiles();
        },

        resetSelectedItem: function () {
            selectedFile(null);
        },

        navigateToSelectedFile: function () {
            this.showDetail(selectedFile());
        },

        showDetail: function (item) {
            if (item) {
                module.router.navigate('#/files/detail/' + item.data().Id(), true);
            }
        }

    };
    
    function getFiles() {
        var deferred = Q.defer();
        isLoading(true);
        datacontext.getFiles()
            .then(function (data) {
                var listItems = ko.utils.arrayMap(data.results, function (item) {
                    return new FileListItem(item);
                });

                ko.utils.arrayForEach(listItems, function (item) {
                    files.push(item);
                });

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
            files.remove(item);
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

    return vm;
});