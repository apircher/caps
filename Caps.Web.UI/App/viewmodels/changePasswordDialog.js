define(['plugins/dialog', 'knockout'], function (dialog, ko) {

    var ChangePasswordDialog = function () {
        this.oldPassword = ko.observable('').extend({ required: true, minLength: 6 });
        this.newPassword = ko.observable('').extend({ required: true, minLength: 6 });

        ko.validation.group(this);
    };

    ChangePasswordDialog.prototype.ok = function () {
        if (this.isValid()) {
            dialog.close(this, { oldPassword: this.oldPassword(), newPassword: this.newPassword() });
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