define([
    'ko',
    'durandal/system'
],
function (ko, system) {
    
    /*
     * UploadManager Class
     */
    function UploadManager(options) {
        var self = this;

        self.isUploading = ko.observable(false);
        self.progress = ko.observable(0);

        self.lastSelection = ko.observableArray();
        self.pendingUploads = [];
        self.beforeUploadCalled = false;

        self.filesSelected = function (e, data) {
            self.lastSelection(data.files);
            self.pendingUploads = [];
            self.beforeUploadCalled = false;
        };

        self.addFiles = function (e, data) {
            if (options.beforeUpload && typeof options.beforeUpload === 'function') {
                self.pendingUploads.push(data);
                if (!self.beforeUploadCalled) {
                    self.beforeUploadCalled = true;
                    options.beforeUpload.call(this, self.lastSelection(), data, beginUpload);
                }
            }
            else
                beginUpload();

            function beginUpload(storageOptions) {
                self.isUploading(true);

                if (self.pendingUploads.length)
                    self.pendingUploads.forEach(function (d) { submitFiles(d, storageOptions); });
                else
                    submitFiles(data, storageOptions);
            }

            function submitFiles(data, storageOptions) {
                var i = 0;
                ko.utils.arrayForEach(data.files, function (f) {
                    if (options.uploadStarted && typeof options.uploadStarted === 'function')
                        options.uploadStarted(f, i++, storageOptions);
                });

                if (storageOptions) data.formData = storageOptions;
                data.submit();
            }
        };

        self.uploadDone = function (e, data) {
            ko.utils.arrayForEach(data.result, function (r) {
                var file = ko.utils.arrayFirst(data.files, function (f) { return f.name === r.fileName; });
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

    return UploadManager;
});