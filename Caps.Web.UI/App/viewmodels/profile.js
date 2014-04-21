/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'durandal/app',
    'authentication',
    'plugins/router',
    'plugins/dialog',
    './changePasswordDialog',
    'moment',
    'knockout',
    'toastr',
    'infrastructure/screen',
    'Q',
    './setPasswordDialog'
],
function (app, authentication, router, dialog, ChangePasswordDialog, moment, ko, toastr, screen, Q, SetPasswordDialog) {
    'use strict';

    var user = authentication.user;
    var logins = ko.observableArray();
    var externalLoginProviders = ko.observableArray();
    var localLoginProvider = ko.observable();

    var vm = {
        user: user,
        logins: logins,
        externalLoginProviders: externalLoginProviders,

        activate: function () {
            logins([]);
            externalLoginProviders([]);

            return authentication.getAccountManagementInfo(escape('/'), true)
                .then(function (data) {
                    localLoginProvider(data.localLoginProvider);

                    ko.utils.arrayForEach(data.logins, function (item) {
                        logins.push(new RemoveLoginViewModel(item, vm));
                    });

                    ko.utils.arrayForEach(data.loginProviders, function (item) {
                        externalLoginProviders.push(new AddExternalLoginViewModel(item));
                    });
                });
        },

        lastPasswordChangedDateFormatted: ko.computed(function () {
            if (!user().hasEverChangedPassword()) return 'Noch nie';
            return moment.utc(user().lastPasswordChangedDate()).fromNow();
        }),

        changePassword: function () {
            ChangePasswordDialog.show().then(changePasswordResolved);

            function changePasswordResolved(data) {
                if (data) {
                    return authentication.changePassword(data)
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

        addLocalPassword: function() {
            SetPasswordDialog.show().then(setPasswordResolved);

            function setPasswordResolved(data) {
                if (data) {
                    return authentication.setPassword(data)
                        .then(function () {
                            logins.push(new RemoveLoginViewModel({
                                loginProvider: localLoginProvider(),
                                providerKey: user().userName()
                            }, vm));
                        });
                }
            }
        },

        logOff: function () {
            if (authentication.isAuthenticated() === true)
                authentication.logoff().then(router.navigate('login', { trigger: true, replace: true }));
        },

        hasLocalPassword: ko.computed(function () {
            var lp = ko.utils.arrayFirst(logins(), function (l) {
                return l.loginProvider() === localLoginProvider();
            })
            return !!lp;
        }),

        moment: moment
    };

    return vm;

    function AddExternalLoginViewModel(data) {
        var self = this;

        self.name = ko.observable(data.name);

        // Operations
        self.login = function () {
            sessionStorage["state"] = data.state;
            sessionStorage["associatingExternalLogin"] = true;
            // IE doesn't reliably persist sessionStorage when navigating to another URL. Move sessionStorage temporarily
            // to localStorage to work around this problem.
            app.archiveSessionStorageToLocalStorage();
            window.location = data.url;
        };
    }


    function RemoveLoginViewModel(data, parent) {
        // Private state
        var self = this,
            providerKey = ko.observable(data.providerKey);

        // Data
        self.loginProvider = ko.observable(data.loginProvider);

        // Other UI state
        self.removing = ko.observable(false);

        self.canRemove = ko.computed(function () {
            return parent.logins().length > 1;
        });

        // Operations
        self.remove = function () {
            self.removing(true);
            authentication.removeLogin(self.loginProvider(), providerKey())
            .then(function (data) {
                parent.logins.remove(self);
                //TODO: Toast "Die Anmeldung wurde entfernt."
            });
        };
    }

});