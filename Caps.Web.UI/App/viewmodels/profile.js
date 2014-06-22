/*global define, escape*/

/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'durandal/app',
    'durandal/system',
    'authentication',
    'plugins/router',
    'plugins/dialog',
    './changePasswordDialog',
    'moment',
    'knockout',
    'toastr',
    'infrastructure/screen',
    'Q',
    './setPasswordDialog',
    'modules/user/entities'
],
function (app, system, authentication, router, dialog, ChangePasswordDialog, moment, ko, toastr, screen, Q, SetPasswordDialog, UsersModel) {
    'use strict';

    var user = authentication.user,
        userEntity = ko.observable(),
        logins = ko.observableArray(),
        externalLoginProviders = ko.observableArray(),
        localLoginProvider = ko.observable();

    var hasLocalPassword = ko.computed(function () {
        var lp = ko.utils.arrayFirst(logins(), function (l) {
            return l.loginProvider() === localLoginProvider();
        });
        return !!lp;
    });

    var loginOptions = ko.computed(function () {
        var result = [];

        if (!hasLocalPassword()) 
            result.push(new AddLocalPasswordViewModel());

        ko.utils.arrayForEach(externalLoginProviders(), function (p) {
            if (!p.isEnabled()) result.push(p);
        });

        return result;
    });

    var vm = {
        userEntity: userEntity,

        logins: logins,

        loginOptions: loginOptions,

        activate: function () {
            logins([]);
            externalLoginProviders([]);

            return system.defer(function (dfd) {
                var p1 = authentication.getAccountManagementInfo('/', true).then(function (data) {
                    localLoginProvider(data.localLoginProvider);
                    ko.utils.arrayForEach(data.logins, function (item) {
                        logins.push(new RemoveLoginViewModel(item, vm));
                    });
                    ko.utils.arrayForEach(data.loginProviders, function (item) {
                        externalLoginProviders.push(new AddExternalLoginViewModel(item));
                    });
                });

                var p2 = authentication.getUserEntity().then(function (entity) {
                    userEntity(new UsersModel.User(entity));
                });

                Q.all([p1, p2]).then(dfd.resolve).fail(dfd.reject);
            })
            .promise();
        },

        logOff: function () {
            if (authentication.isAuthenticated() === true)
                authentication.logoff().then(router.navigate('login', { trigger: true, replace: true }));
        },

        hasLocalPassword: hasLocalPassword
    };

    return vm;
    
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

        self.title = ko.computed(function () {
            if (self.loginProvider() === localLoginProvider())
                return 'Caps-Passwort';
            return self.loginProvider();
        });

        self.isLocalLoginProvider = ko.computed(function () {
            return self.loginProvider() === localLoginProvider();
        });

        self.changePassword = function () {
            ChangePasswordDialog.show().then(changePasswordConfirmed);
            function changePasswordConfirmed(data) {
                if (data) {
                    return authentication.changePassword(data)
                        .then(function () {
                            toastr.success('Das Passwort wurde erfolgreich geändert.', 'Passwort geändert', {
                                positionClass: screen.isPhone() ? 'toast-bottom-full-width' : 'toast-bottom-right'
                            });
                        })
                        .fail(function () {
                            dialog.showMessage('Das Passwort konnte nicht geändert werden. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin auftritt', 'Nicht erfolgreich');
                        });
                }
            }
        };

        self.lastPasswordChangedDateFormatted = ko.computed(function () {
            if (!user().hasEverChangedPassword()) return 'Noch nie';
            return moment.utc(user().lastPasswordChangedDate()).fromNow();
        });

        self.lastPasswordChangedDate = ko.computed(function () {
            if (!user().hasEverChangedPassword()) return '';
            return moment(user().lastPasswordChangedDate()).format('LLLL');
        });

        // Operations
        self.remove = function () {
            self.removing(true);
            authentication.removeLogin(self.loginProvider(), providerKey())
            .then(function () {
                parent.logins.remove(self);
                //TODO: Toast "Die Anmeldung wurde entfernt."
            });
        };
    }

    function AddLocalPasswordViewModel() {
        var self = this;

        self.name = ko.observable('Caps-Passwort');

        self.isLocalLoginProvider = true;

        self.login = function () {
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
        };
    }

    function AddExternalLoginViewModel(data) {
        var self = this;

        self.name = ko.observable(data.name);

        self.isEnabled = ko.computed(function () {
            return !!ko.utils.arrayFirst(logins(), function (l) {
                return l.loginProvider() === self.name();
            });
        });

        self.isLocalLoginProvider = false;

        // Operations
        self.login = function () {
            sessionStorage.state = data.state;
            sessionStorage.associatingExternalLogin = true;
            // IE doesn't reliably persist sessionStorage when navigating to another URL. Move sessionStorage temporarily
            // to localStorage to work around this problem.
            app.archiveSessionStorageToLocalStorage();
            window.location = data.url;
        };
    }

});