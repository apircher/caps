define(['plugins/dialog', 'knockout', 'authentication'], function (dialog, ko, authentication) {

    var SetPasswordDialog = function () {
        this.newPassword = ko.observable('').extend({ required: true, minLength: 6 });
        ko.validation.group(this);

        this.minRequiredPasswordLength = authentication.metadata.minRequiredPasswordLength;
    };

    SetPasswordDialog.prototype.ok = function () {
        if (this.isValid()) {
            dialog.close(this, this.newPassword());
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