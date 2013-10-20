define(['ko'], function (ko) {
    
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

    return UploadManager;
});