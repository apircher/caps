/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'plugins/dialog',
    'knockout',
    'durandal/app'
], function (dialog, ko, app) {
    'use strict';

    function AddPageDialog() {
        var self = this;

        self.title = ko.observable('').extend({ required: true });

        ko.validation.group(self);
    }

    AddPageDialog.prototype.ok = function () {
        dialog.close(this, { title: this.title() });
    };

    AddPageDialog.prototype.cancel = function () {
        dialog.close(this, null);
    };

    AddPageDialog.show = function () {
        return dialog.show(new AddPageDialog());
    };

    return AddPageDialog;
});