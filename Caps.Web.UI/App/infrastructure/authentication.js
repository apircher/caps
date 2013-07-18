define(['Q', 'durandal/system', 'durandal/app', 'plugins/router', 'knockout', 'infrastructure/antiForgeryToken', 'moment'], function (Q, system, app, router, ko, antiForgeryToken, moment) {
    
    var self = this,
        user = ko.observable(new UserModel()),
        logonModuleId = 'viewmodels/login',
        logonRoute = 'login',
        defaultReturnUrl = '';

    var isAuthenticated = ko.computed(function () {
            return user().isAuthenticated();
        });
    
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
                else
                    deferred.reject(data);

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
        user: user,
        logon: logon,
        logoff: logoff,
        changePassword: changePassword,
        isAuthenticated: isAuthenticated,
        initialize: getUser,

        UserModel: UserModel
    };
});