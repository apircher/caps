define(['authentication', 'plugins/router', 'plugins/dialog', './changePasswordDialog', 'moment', 'knockout', 'toastr', 'infrastructure/screen'
], function (authentication, router, dialog, ChangePasswordDialog, moment, ko, toastr, screen) {

    var user = authentication.user;

    return {
        user: user,

        lastPasswordChangedDateFormatted: ko.computed(function () {
            if (!user().hasEverChangedPassword()) return 'Noch nie';
            return moment.utc(user().lastPasswordChangedDate()).fromNow();
        }),

        changePassword: function () {
            ChangePasswordDialog.show().then(changePasswordResolved);

            function changePasswordResolved(data) {
                if (data) {
                    return authentication.changePassword(data.oldPassword, data.newPassword)
                        .then(function () {
                            toastr.success('Das Passwort wurde erfolgreich geändert.', 'Passwort geändert', {
                                positionClass: screen.isPhone() ? 'toast-bottom-full-width' : 'toast-bottom-right'
                            });
                        })
                        .fail(function (err) {
                            dialog.showMessage('Das Passwort konnte nicht geändert werden. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin auftritt', 'Nicht erfolgreich');
                        });
                }
            }
        },

        logOff: function () {
            if (authentication.isAuthenticated() === true)
                authentication.logoff().then(router.navigate('login', { trigger: true, replace: true }));
        },

        moment: moment
    };

});