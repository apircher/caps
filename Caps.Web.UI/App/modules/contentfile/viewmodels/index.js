define([
    'knockout', '../datacontext', 'jquery', 'toastr', 'plugins/dialog', 'Q', 'jquery-ui', 'jquery.fileupload', 'jquery.infinitescroll'
], function (ko, datacontext, $, toastr, dialog, Q) {
        
    var files = ko.observableArray([]),
        isLoading = ko.observable(false);

    function getFiles() {
        var deferred = Q.defer();
        isLoading(true);
        datacontext.getFiles()
            .then(function (data) {
                ko.utils.arrayForEach(data.results, function (item) {
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

    var vm = {
        files: files,
        isLoading: isLoading,

        uploadDone: function (e, data) {
            ko.utils.arrayForEach(data.result, function (r) {
                datacontext.fetchFile(r.Id).then(function () {
                    files.push(datacontext.localGetFile(r.Id));
                })
                .fail(function (err) {
                    toastr.error('Die Datei ' + r.FileName + ' konnte nicht geladen werden.');
                });
            });
        },

        filesDropped: function(e, data) {            
            if (e.dataTransfer.dropEffect === 'copy')
                return false;
        },

        activate: function () {
            getFiles().then(function () {
                Holder.run({ domain: 'caps.placeholder' });
            });
        },

        deleteFile: function (item) {
            var btnOk = 'Datei löschen';
            var btnCancel = 'Abbrechen';
            dialog.showMessage('Soll die Datei ' + item.FileName() + ' wirklich gelöscht werden?', 'Datei löschen', [btnOk, btnCancel])
                .then(function (result) {
                    if (result === btnOk)
                        datacontext.deleteFile(item).then(deleteSucceeded).fail(deleteFailed);
                });
            function deleteSucceeded() {
                files.remove(item);
            }
            function deleteFailed(err) {
                dialog.showMessage('Die Datei konnte nicht gelöscht werden.', 'Nicht erfolgreich');
            }
        },

        refresh: function () {
            files.removeAll();
            getFiles();
        }
    };

    return vm;
});