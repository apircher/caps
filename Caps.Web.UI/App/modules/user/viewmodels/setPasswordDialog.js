define(['plugins/dialog', 'knockout'], function (dialog, ko) {

    var SetPasswordDialog = function () {
        this.newPassword = ko.observable('').extend({ required: true, minLength: 6 });
        ko.validation.group(this);
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