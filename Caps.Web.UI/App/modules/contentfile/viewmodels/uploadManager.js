/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'ko',
    'durandal/system',
    'durandal/app',
    './../datacontext',
    './fileUploadDialog'
],
function (ko, system, app, datacontext, FileUploadDialog) {
    'use strict';
    
    /**
     * UploadManager Class
     */
    function UploadManager() {
        var self = this,
            batches = new UploadBatchCollection();

        self.isUploading = ko.observable(false);
        self.progress = ko.observable(0);
        self.currentUploads = ko.observableArray();

        self.addFiles = function (e, data) {
            var batch = batches.findOrAddBatch(data);
            if (batch) {
                batch.addFiles(data);
                if (batch.files.length === data.originalFiles.length) {
                    if (batch.storageOption === 'replace')
                        batch.submit();
                    else
                    {
                        // if storage option is not 'replace' get file metadata.
                        prepareUpload(batch.originalFiles, function (newStorageOption, filesExistingOnServer) {
                            if (newStorageOption) batch.storageOption = newStorageOption;
                            if (filesExistingOnServer) batch.filesExistingOnServer = filesExistingOnServer;
                            batch.submit();
                        });
                    }
                }
            }
        };

        self.filesDropped = function (e, data) {
            var evt;
            if (e && e.delegatedEvent) evt = e.delegatedEvent;
            else evt = e;
            if (evt && evt.dataTransfer && evt.dataTransfer.dropEffect === 'copy')
                return false;
        };

        self.uploadDone = function (e, data) {
            ko.utils.arrayForEach(data.result, function (r) {
                var file = ko.utils.arrayFirst(data.files, function (f) { return f.name === r.fileName; });
                self.currentUploads.remove(file);
                app.trigger('uploadManager:uploadDone', file, r);
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

        function prepareUpload(files, callback) {
            var fileNames = ko.utils.arrayMap(files, function (f) { return f.name; });
            datacontext.getFileInfo(fileNames).then(function (result) {
                var existingFiles = ko.utils.arrayFilter(result, function (r) { return r.count > 0; });
                if (existingFiles.length > 0) {
                    var dlgVm = new FileUploadDialog(result);
                    app.showDialog(dlgVm).then(function (dialogResult) {
                        if (dialogResult)
                            callback(dialogResult.storageOption, existingFiles);
                    });
                }
                else
                    callback();
            });
        }
    }

    /**
     * Class UploadBatch
     */
    function UploadBatch(originalFiles) {
        var self = this;
        self.originalFiles = originalFiles;
        self.files = [];
        self.storageOption = 'add';
        self.filesExistingOnServer = [];

        self.addFiles = function (data) {
            self.files.push(data);
        };

        self.submit = function () {
            var index = 0;
            ko.utils.arrayForEach(self.files, function (data) {
                var file = data.files[0];
                var so = self.storageOption;
                if (self.filesExistingOnServer && self.filesExistingOnServer.length > 0 && !fileNameExistsOnServer(file.name))
                    so = undefined;
                app.trigger('uploadManager:uploadStarted', file, index++, so);
                app.uploadManager.currentUploads.push(file);
                data.formData = collectFormData(data);
                data.formData.storageAction = so;

                data.submit();
            });
        };

        function fileNameExistsOnServer(fileName) {
            return !!ko.utils.arrayFirst(self.filesExistingOnServer, function (f) { return f.fileName === fileName; });
        }

        function collectFormData(data) {
            var formData = {};
            if (data.fileInput) {
                var vid = data.fileInput.data('replace-id');
                if (vid) formData.versionId = vid;
            }
            return formData;
        }
    }

    /**
     * Class UploadBatchCollection
     */
    function UploadBatchCollection() {
        var self = this,
            batches = [];

        self.findOrAddBatch = function (data) {
            var batch = self.findBatch(data.originalFiles);
            if (!batch) {
                batch = new UploadBatch(data.originalFiles);
                if (data.fileInput) {
                    var storageOption = data.fileInput.data('storage-option');
                    if (storageOption) batch.storageOption = storageOption;
                }
                batches.push(batch);
            }
            return batch;
        };

        self.findBatch = function (originalFiles) {
            return ko.utils.arrayFirst(batches, function (b) { return b.originalFiles === originalFiles; });
        };

        self.removeBatch = function (originalFiles) {
            var batch = self.findBatch(originalFiles);
            if (batch) {
                var index = batches.indexOf(batch);
                batches.splice(index, 1);
            }
        };
    }

    return UploadManager;
});