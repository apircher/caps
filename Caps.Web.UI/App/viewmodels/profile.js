define(['authentication', 'plugins/router', 'plugins/dialog', './changePasswordDialog'], function (authentication, router, dialog, ChangePasswordDialog) {

    return {
        user: authentication.user,

        changePassword: function () {
            ChangePasswordDialog.show().then(changePasswordResolved);

            function changePasswordResolved(data) {
                if (data) {
                    return authentication.changePassword(data.oldPassword, data.newPassword)
                        .fail(function (err) {
                            dialog.showMessage('Das Passwort konnte nicht geändert werden. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin auftritt', 'Nicht erfolgreich');
                        });
                }
            }
        },

        logOff: function () {
            if (authentication.isAuthenticated() === true)
                authentication.logoff().then(router.navigate('login', { trigger: true, replace: true }));
        }
    };

});