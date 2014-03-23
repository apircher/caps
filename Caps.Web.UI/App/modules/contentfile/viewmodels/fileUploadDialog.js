define(['plugins/dialog'], function (dialog) {

    function FileUploadDialog(fileInfo) {
        this.fileInfo = fileInfo;
        this.existingFiles = ko.utils.arrayFilter(fileInfo, function (r) { return r.count > 0; });
    }

    FileUploadDialog.prototype.addFiles = function () {
        dialog.close(this, { 'storageAction': 'add' });

    };

    FileUploadDialog.prototype.replaceFiles = function () {
        dialog.close(this, { 'storageAction': 'replace' });

    };

    FileUploadDialog.prototype.cancel = function () {
        dialog.close(this);

    };

    return FileUploadDialog;

});