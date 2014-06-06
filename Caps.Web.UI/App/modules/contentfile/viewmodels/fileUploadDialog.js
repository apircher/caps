/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define(['plugins/dialog'], function (dialog) {
    'use strict';

    /**
     * FileUploadDialog class
     */
    function FileUploadDialog(fileInfo) {
        this.fileInfo = fileInfo;
        this.existingFiles = ko.utils.arrayFilter(fileInfo, function (r) { return r.count > 0; });
    }

    FileUploadDialog.prototype.addFiles = function () {
        dialog.close(this, { 'storageOption': 'add' });

    };

    FileUploadDialog.prototype.replaceFiles = function () {
        dialog.close(this, { 'storageOption': 'replace' });

    };

    FileUploadDialog.prototype.cancel = function () {
        dialog.close(this);

    };

    return FileUploadDialog;

});