define(['plugins/dialog', 'knockout', 'durandal/app'], function (dialog, ko, app) {

    var SetPasswordDialog = function () {
        var self = this;

        self.newPassword = ko.observable('').extend({ required: true, minLength: 6 });
        self.confirmPassword = ko.observable('').extend({ required: true, equal: self.newPassword });

        ko.validation.group(self);
    };

    SetPasswordDialog.prototype.ok = function () {
        if (this.isValid()) {
            dialog.close(this, { newPassword: this.newPassword(), confirmPassword: this.confirmPassword() });
        }
        else {
            app.showMessage('Das Passwort kann noch nicht erstellt werden. Prüfe die markierten Felder und korrigiere die Eingaben entsprechend.', 'Unvollständig');
        }
    };

    SetPasswordDialog.prototype.cancel = function () {
        dialog.close(this, null);
    };

    SetPasswordDialog.show = function () {
        return dialog.show(new SetPasswordDialog());
    };

    return SetPasswordDialog;
});