define(['plugins/dialog', 'knockout'], function (dialog, ko) {

    var DeleteUserConfirmationDialog = function (userName) {
        this.userName = ko.observable(userName || '');
    };

    DeleteUserConfirmationDialog.prototype.ok = function () {
        dialog.close(this, 'Löschen');
    };

    DeleteUserConfirmationDialog.prototype.cancel = function () {
        dialog.close(this, 'Abbrechen');
    };

    DeleteUserConfirmationDialog.show = function (userName) {
        return dialog.show(new DeleteUserConfirmationDialog(userName));
    };

    return DeleteUserConfirmationDialog;
});