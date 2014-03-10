define(['plugins/dialog', 'knockout', 'authentication'], function (dialog, ko, authentication) {

    var SetPasswordDialog = function () {
        var self = this;
        self.newPassword = ko.observable('').extend({ required: true, minLength: 6 });
        self.confirmPassword = ko.observable('').extend({ equal: self.newPassword });
        ko.validation.group(this);

        this.minRequiredPasswordLength = authentication.metadata.minRequiredPasswordLength;
    };

    SetPasswordDialog.prototype.ok = function () {
        if (this.isValid()) {
            dialog.close(this, { newPassword: this.newPassword(), confirmPassword: this.confirmPassword() });
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