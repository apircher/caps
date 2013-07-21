define(['Q', 'durandal/system', 'durandal/app', 'plugins/router', 'knockout', 'infrastructure/antiForgeryToken', 'moment'], function (Q, system, app, router, ko, antiForgeryToken, moment) {
    
    var self = this,
        user = ko.observable(new UserModel()),
        logonModuleId = 'viewmodels/login',
        logonRoute = 'login',
        defaultReturnUrl = '',
        metadata = {
            lockoutPeriod: 15,
            minRequiredPasswordLength: 6
        };

    var isAuthenticated = ko.computed(function () {
        return user().isAuthenticated();
    });

    function getMetadata() {
        return Q.when($.ajax('/Caps/GetAuthenticationMetadata', { method: 'post' }))
            .then(function (data) {
                metadata.lockoutPeriod = data.LockoutPeriod;
                metadata.minRequiredPasswordLength = data.MinRequiredPasswordLength;
            })
            .fail(function (err) {
                system.log('getMetadata failed: ' + err.message);
            });
    }
    
    function getUser() {
        return Q.when($.ajax('/Caps/GetCurrentUser', { method: 'post' }))
            .then(function (data) { user(new UserModel(data.IsAuthenticated, data.UserName, data.Roles)); })
            .fail(function (error) { system.log('getCurrentUser failed: ' + error.message); });
    }

    function refreshUserWhenExpired() {
        var deferred = Q.defer();
        if (isAuthenticated() && !user().isExpired()) 
            deferred.resolve();
        else 
            getUser().then(deferred.resolve).fail(deferred.reject);
        return deferred.promise;
    }

    function logon(userName, password, rememberMe) {
        var deferred = Q.defer();
        $.ajax('/Caps/Logon', { method: 'post', data: { UserName: userName, Password: password, RememberMe: rememberMe } })
            .done(function (data) {

                if (data.IsAuthenticated === true) {
                    system.log('logon successful');
                    Q.fcall(antiForgeryToken.initToken)
                        .then(getUser)
                        .then(function () {
                            app.trigger('caps:authentication:loggedOn', user());
                            deferred.resolve(data);
                        })
                        .fail(function (error) {
                            deferred.reject(err);
                        });
                }
                else {
                    var msg = logonResponseToDisplayMessage(data);
                    deferred.reject(new Error(msg));
                }

            })
            .fail(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    }

    function logoff() {
        return Q.when($.ajax('/Caps/Logoff', { method: 'post' }))
            .then(antiForgeryToken.initToken)
            .then(function () {
                system.log('logoff successful');
                app.trigger('caps:authentication:loggedOff');
                user(new UserModel());
            });
    }

    function changePassword(oldPassword, newPassword) {
        return Q.when($.ajax('/Caps/ChangePassword', { method: 'post', data: { OldPassword: oldPassword, NewPassword: newPassword } }));
    }

    function logonResponseToDisplayMessage(response) {
        var defaultMessage = 'Die Anmeldung ist fehlgeschlagen. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin besteht.';
        if (response) {
            var err = response.Error;
            if (err) {
                if (err == 'ERROR_LOCKED') {
                    var message = 'Dein Konto wurde aufgrund zu vieler ungültiger Anmelde-Versuche gesperrt. Die Sperrung wird nach {0} Minuten automatisch aufgehoben.';
                    return message.replace(/\{0\}/gi, metadata.lockoutPeriod);
                }
                if (err == 'ERROR_NOTAPPROVED')
                    return 'Dein Konto wurde noch nicht bestätigt.';
                if (err == 'ERROR_USER_OR_PASSWORD_INVALID')
                    return 'Der Benutzername oder das Passwort sind ungültig.';
                if (err == 'Bad request')
                    return defaultMessage;
            }
        }
        return response.Error || defaultMessage;
    }

    // Extend the Router Plugin
    router.logon = function (routeInfo) {
        if (routeInfo.config.moduleId === logonModuleId)
            throw new Error('The logon-Function may not be called with the logon-route.');
        router.logonSuccessRoute = routeInfo;
        return logonRoute;
    };

    // Return to original route after successful logon.
    router.redirectFromLogonView = function () {
        var returnUrl = defaultReturnUrl;
        if (router.logonSuccessRoute) {
            var r = router.logonSuccessRoute;
            delete router.logonSuccessRoute;
            returnUrl = r.config.hash;
        }
        router.navigate(returnUrl, { trigger: true, replace: true });
    };

    // Check authentication while navigating
    router.guardRoute = function (vm, routeInfo) {
        var deferred = Q.defer();
        refreshUserWhenExpired()
            .then(function () {
                if (isAuthenticated() || routeInfo.config.moduleId === logonModuleId) {
                    if (routeInfo.config.roles) {
                        if (user().isInAnyRole(routeInfo.config.roles))
                            return true;
                        // Not allowed
                        return 'forbidden';
                    }
                    return true;
                }
                else
                    return router.logon(routeInfo);
            })
            .then(deferred.resolve)
            .fail(deferred.reject)
            .done();

        return deferred.promise;
    };

    // User ViewModel
    function UserModel(isAuthenticated, userName, roles, expiration) {
        this.isAuthenticated = ko.observable(isAuthenticated || false);
        this.userName = ko.observable(userName || '');
        this.roles = ko.observable(roles || []);
        this.created = new Date();
        this.expiration = expiration || false;

        this.isInRole = function (roleName) {
            for (var i = 0; i < this.roles().length; i++) {
                if (this.roles()[i] == roleName) return true;
            }
            return false;
        };

        this.isInAnyRole = function (roleNames) {
            if (!roleNames || roleNames.length == 0)
                return true;
            for (var i = 0; i < roleNames.length; i++) {
                if (this.isInRole(roleNames[i])) return true;
            }
            return false;
        };
    }

    UserModel.prototype.isExpired = function () {
        if (!this.expiration) return false;
        return moment(this.created).add('seconds', this.expiration) < new Date();
    };

    return {
        metadata: metadata,
        user: user,
        logon: logon,
        logoff: logoff,
        changePassword: changePassword,
        isAuthenticated: isAuthenticated,
        initialize: function () {
            return getMetadata().then(getUser);

        },

        UserModel: UserModel
    };
});