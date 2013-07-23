define([
    '../datacontext', '../entities', 'knockout', 'Q', 'plugins/dialog', 'modules/user/module', '../commands/deleteUser', 'durandal/app', 'moment', './setPasswordDialog', 'authentication', 'toastr', 'infrastructure/screen'
], function (datacontext, model, ko, Q, dialog, module, deleteUserCommand, app, moment, SetPasswordDialog, authentication, toastr, screen) {

    var vm = {
        user: ko.observable(),
        userName: ko.observable(),
        isLoading: ko.observable(false),

        activate: function (userName) {
            this.userName(userName);
            return refreshUser();
        },

        editUser: editUser,
        changePassword : changePassword,
        deleteUser: function () {
            deleteUserCommand.execute(this.user())
                .then(navigateBack);
        },
        refresh: refreshUser,
        navigateBack: navigateBack,
        moment: moment,
        authentication: authentication
    };

    function refreshUser() {
        var deferred = Q.defer();
        if (!vm.userName() || vm.userName().length == 0) {
            vm.user(new model.User());
            deferred.resolve();
        }
        else {
            vm.isLoading(true);
            datacontext.getUser(vm.userName())
                .then(function (data) {
                    vm.user(data);
                    deferred.resolve();
                })
                .fail(function (err) {
                    dialog.showMessage('Die Benutzerdaten konnten nicht geladen werden.', 'Nicht geladen')
                        .then(deferred.reject);
                })
                .done(function () {
                    vm.isLoading(false);
                });
        }
        return deferred.promise;
    }
    function editUser() {
        module.router.navigate('#/users/edit/' + vm.userName());
    }
    function changePassword() {
        SetPasswordDialog.show()
            .then(function (newPassword) {
                if (newPassword) setPassword(newPassword);
            });
    }
    function setPassword(newPassword) {
        datacontext.setPassword(vm.userName(), newPassword)
            .then(refreshUser)
            .then(function () {
                toastr.success('Das Passwort wurde erfolgreich geändert.', 'Passwort geändert', {
                    positionClass: screen.isPhone() ? 'toast-bottom-full-width' : 'toast-bottom-right'
                });
            })
            .fail(function (err) {
                dialog.showMessage('Das Passwort konnte nicht festgelegt werden. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin auftritt.', 'Nicht erfolgreich');
            });
    }
    function navigateBack() {
        module.router.navigate(module.routeConfig.hash, true);
    }

    return vm;
});