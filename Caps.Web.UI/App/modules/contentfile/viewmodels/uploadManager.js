/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'ko',
    'durandal/system',
    'durandal/app'
],
function (ko, system, app) {
    'use strict';
    
    /**
     * UploadManager Class
     */
    function UploadManager(options) {
        var self = this;

        options = $.extend({}, options);

        self.isUploading = ko.observable(false);
        self.progress = ko.observable(0);

        self.lastSelection = ko.observableArray();
        self.pendingUploads = [];
        self.beforeUploadCalled = false;
        self.batchIndex = 0;

        self.currentUploads = ko.observableArray();

        self.filesSelected = function (e, data) {
            self.lastSelection(data.files);
            self.pendingUploads = [];
            self.beforeUploadCalled = false;
            self.batchIndex = 0;
        };

        self.addFiles = function (e, data) {
            var storageOption = data.fileInput ? data.fileInput.data('storage-option') : '';
            if (storageOption !== 'replace' && system.isFunction(options.beforeUpload)) {
                self.pendingUploads.push(data);
                triggerBeforeUploadCalled(self.lastSelection(), beginUpload);
            }
            else
                beginUpload();

            function beginUpload(storageOptions, existingFiles) {
                self.isUploading(true);

                if (self.pendingUploads.length)
                    self.pendingUploads.forEach(function (d) {
                        submitFiles(d, storageOptions, existingFiles);
                    });
                else
                    submitFiles(data, storageOptions, existingFiles);
            }

            function submitFiles(data, storageOptions, existingFiles) {
                ko.utils.arrayForEach(data.files, function (f) {
                    var hasExistingFile = false;
                    if (existingFiles) {
                        hasExistingFile = !!ko.utils.arrayFirst(existingFiles, function (ef) { return f.name === ef.fileName; });
                    }
                    triggerUploadStarted(f, self.batchIndex++, hasExistingFile ? storageOptions : undefined);
                });
                if (storageOptions) data.formData = storageOptions;
                data.submit();
            }
        };

        self.uploadDone = function (e, data) {
            ko.utils.arrayForEach(data.result, function (r) {
                var file = ko.utils.arrayFirst(data.files, function (f) { return f.name === r.fileName; });
                triggerUploadDone(r, file);
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
            var evt;
            if (e && e.delegatedEvent) evt = e.delegatedEvent;
            else evt = e;

            if (evt && evt.dataTransfer && evt.dataTransfer.dropEffect === 'copy')
                return false;

            self.filesSelected(e, data);
        };

        function triggerBeforeUploadCalled(files, callback) {
            if (!self.beforeUploadCalled) {
                self.beforeUploadCalled = true;
                options.beforeUpload.call(this, files, callback);
            }

            app.trigger('uploadManager:beforeUpload', files, callback);
        }

        function triggerUploadStarted(file, index, storageOptions) {
            if (system.isFunction(options.uploadStarted))
                options.uploadStarted(file, index, storageOptions);

            app.trigger('uploadManager:uploadStarted', file, index, storageOptions);

            self.currentUploads.push(file);
        }

        function triggerUploadDone(data, file) {
            if (system.isFunction(options.uploadDone))
                options.uploadDone(data, file);

            app.trigger('uploadManager:uploadDone', file, data);

            self.currentUploads.remove(file);
        }
    }

    return UploadManager;
});