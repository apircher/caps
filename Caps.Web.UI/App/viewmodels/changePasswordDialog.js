/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'plugins/dialog',
    'knockout',
    'durandal/app'
],
function (dialog, ko, app) {
    'use strict';

    var ChangePasswordDialog = function () {
        var self = this;

        self.oldPassword = ko.observable('').extend({ required: true });
        self.newPassword = ko.observable('').extend({ required: true, minLength: 6 });
        self.confirmPassword = ko.observable('').extend({ required: true, equal: self.newPassword });

        ko.validation.group(self);
    };

    ChangePasswordDialog.prototype.ok = function () {
        if (this.isValid()) {
            dialog.close(this, { oldPassword: this.oldPassword(), newPassword: this.newPassword(), confirmPassword: this.confirmPassword() });
        }
        else {
            app.showMessage('Das Passwort kann noch nicht geändert werden. Prüfe die markierten Felder und korrigiere die Eingaben entsprechend.', 'Unvollständig');
        }
    };

    ChangePasswordDialog.prototype.cancel = function () {
        dialog.close(this, null);
    };

    ChangePasswordDialog.show = function () {
        return dialog.show(new ChangePasswordDialog());
    };

    return ChangePasswordDialog;
});