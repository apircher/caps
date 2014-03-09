/*
 * authentication.js
 * Handles user authentication.
 */
define([
    'Q',
    'durandal/system',
    'durandal/app',
    'plugins/router',
    'ko',
    'infrastructure/antiForgeryToken',
    'moment',
    'infrastructure/utils'
], function (Q, system, app, router, ko, antiForgeryToken, moment, utils) {
    
    var user = ko.observable(new UserModel()),
        logonModuleId = 'viewmodels/login',
        logonRoute = 'login',
        defaultReturnUrl = '',
        metadata = {
            lockoutPeriod: 15,
            minRequiredPasswordLength: 6
        };

    function setAccessToken(token, rememberMe) {
        var storage = rememberMe ? localStorage : sessionStorage;
        storage["accessToken"] = token;
    }

    function getAccessToken() {
        return sessionStorage["accessToken"] || localStorage["accessToken"];
    }

    function clearAccessToken() {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
    }


    /*
     * Handles global ajax events to send the tokens back to the server.
     */
    $(document).ajaxSend(function (event, request, settings) {
        var accessToken = getAccessToken();
        if (accessToken) {
            request.setRequestHeader('Authorization', "Bearer " + accessToken);
        }
    });

    var isAuthenticated = ko.computed(function () {
        return user().isAuthenticated();
    });

    /*
     * Fetches authentication metadata from the server.
     */
    function getMetadata() {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/authmetadata', { method: 'get' })
                .then(function (data) {
                    metadata.lockoutPeriod = data.lockoutPeriod;
                    metadata.minRequiredPasswordLength = data.minRequiredPasswordLength;
                    dfd.resolve();
                })
                .fail(function (error) {
                    system.log('getMetadata failed: ' + error.message);
                    dfd.reject(error);
                });
        })
        .promise();
    }
    
    /*
     * Fetches metadata for the authenticated user from the server.
     */
    function getUser() {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/userinfo', { method: 'get' })
                .then(function (data) {
                    user(new UserModel(data.isAuthenticated, data.userName, data.roles, data));
                    if (data.IsAuthenticated) app.trigger('caps:authentication:loggedOn', user());
                    dfd.resolve(user());
                })
                .fail(function (error) {
                    system.log('getCurrentUser failed: ' + error.responseJSON.message);
                    if (error.status == 401) {
                        user(new UserModel(false));
                        dfd.resolve(user());
                    }
                    else
                        dfd.reject(error);
                });
        })
        .promise();
    }

    function getAccountManagementInfo(returnUrl, generateState) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/managementinfo', { method: 'get', data: { returnUrl: returnUrl, generateState: generateState } })
                .then(function (data) {
                    dfd.resolve(data);
                })
                .fail(function (error) {
                    dfd.reject(error);
                });
        })
        .promise();
    }

    function getExternalLoginProviders(returnUrl, generateState) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/externallogins', { method: 'get', data: { returnUrl: returnUrl, generateState: generateState } })
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    function addExternalLogin(externalAccessToken) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/addexternallogin', { method: 'post', data: { externalAccessToken: externalAccessToken } })
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    function removeLogin(loginProvider, providerKey) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/removelogin', { method: 'post', data: { loginProvider: loginProvider, providerKey: providerKey } })
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    function setPassword(data) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/setpassword', { method: 'post', data: data })
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    /*
     * Fetches metadata for the authenticated user if the cached data is expired.
     */ 
    function refreshUserWhenExpired() {
        return system.defer(function (dfd) {
            if (isAuthenticated() && !user().isExpired())
                dfd.resolve(user());
            else {
                if (user().isExpired())
                    getUser().then(dfd.resolve).fail(dfd.reject);
                else
                    dfd.resolve(user());
            }
        })
        .promise();
    }

    /*
     * Tries to log in a user with the specified credentials.
     */
    function logon(userName, password, rememberMe) {
        return system.defer(function (dfd) {
            $.ajax('~/Token?rememberMe=' + rememberMe, { method: 'post', data: { grant_type: 'password', UserName: userName, Password: password } })
                .done(logonResultAvailable)
                .fail(logonFailed);

            function logonResultAvailable(data) {
                if (!data.userName || !data.access_token) {
                    logonFailed(new Error(_logonResponseToDisplayMessage(data)));
                    return;
                }

                setAccessToken(data.access_token, rememberMe);
                system.log('logon successful');

                Q.fcall(antiForgeryToken.initToken)
                    .then(getUser)
                    .then(function () {
                        app.trigger('caps:authentication:loggedOn', user());
                        dfd.resolve(data);
                    })
                    .fail(logonFailed);
            }

            function logonFailed(error) {
                system.log('logon failed: ' + error.message || error.error);
                dfd.reject(error);
            }
        })
        .promise();
    }

    /*
     * Logs the current user off.
     */
    function logoff() {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/logout', { method: 'post' })
                .then(clearAccessToken)
                .then(antiForgeryToken.initToken)
                .then(function () {
                    system.log('logoff successful');
                    app.trigger('caps:authentication:loggedOff');
                    user(new UserModel());
                    dfd.resolve();
                })
                .fail(dfd.reject);
        })
        .promise();
    }

    /*
     * Changes the current users password.
     */
    function changePassword(data) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/changepassword', { method: 'post', data: data })
                .then(getUser)
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    /*
     * Redirects to the logon view.
     */
    router.logon = function (routeInfo) {
        if (routeInfo.config.moduleId === logonModuleId)
            throw new Error('The logon-Function may not be called with the logon-route.');
        router.logonSuccessRoute = routeInfo;
        return logonRoute;
    };

    /* 
     * Return to original route after a successful logon.
     */
    router.redirectFromLogonView = function () {
        var returnUrl = defaultReturnUrl;
        if (router.logonSuccessRoute) {
            var r = router.logonSuccessRoute;
            delete router.logonSuccessRoute;
            returnUrl = r.config.hash;
        }
        router.navigate(returnUrl, { trigger: true, replace: true });
    };

    /*
     * Check authentication while navigating
     */
    router.guardRoute = function (vm, routeInfo) {
        return system.defer(function (dfd) {
            refreshUserWhenExpired().then(function () {
                if (isAuthenticated() || routeInfo.config.moduleId === logonModuleId) {
                    if (routeInfo.config.roles && !user().isInAnyRole(routeInfo.config.roles))
                        dfd.resolve('forbidden');
                    dfd.resolve(true);
                }
                else
                    dfd.resolve(router.logon(routeInfo));
            })
            .fail(dfd.reject);
        })
        .promise();
    };


    // User ViewModel
    function UserModel(isAuthenticated, userName, roles, data, expiration) {
        var self = this;
        data = data || {};

        this.expirationTicket = new ExpirationTicket(expiration);
        this.isAuthenticated = ko.observable(isAuthenticated || false);
        this.userName = ko.observable(userName || '');
        this.roles = ko.observable(roles || []);
        this.creationDate = ko.observable(data.creationDate || new Date());
        this.lastPasswordChangedDate = ko.observable(data.lastPasswordChangedDate);

        this.firstName = ko.observable(data.firstName || '');
        this.lastName = ko.observable(data.lastName || '');

        this.displayName = ko.computed(function () {
            if (self.firstName().length > 0)
                return self.firstName();
            else if (self.lastName().length > 0)
                return self.lastName();
            else
                return self.userName();
        });

        this.fullName = ko.computed(function () {
            return '{0} {1}'
                .replace(/\{0\}/, self.firstName())
                .replace(/\{1\}/, self.lastName()).trim();
        });

        this.hasEverChangedPassword = ko.computed(function () {
            return self.lastPasswordChangedDate() > self.creationDate();
        });

        this.isInRole = function (roleName) {
            for (var i = 0; i < this.roles().length; i++) {
                if (this.roles()[i] == roleName) return true;
            }
            return false;
        };

        this.isInAnyRole = function (roleNames) {
            if (!roleNames || roleNames.length === 0)
                return true;
            for (var i = 0; i < roleNames.length; i++) {
                if (this.isInRole(roleNames[i])) return true;
            }
            return false;
        };
    }

    UserModel.prototype.isExpired = function () {
        return this.expirationTicket.isExpired();
    };
        
    function ExpirationTicket(expiration) {
        this.created = new Date();
        this.expiration = expiration || false;
    }

    ExpirationTicket.prototype.isExpired = function () {
        if (!this.expiration) return false;
        return moment(this.created).add('seconds', this.expiration) < new Date();
    };

    function _logonResponseToDisplayMessage(response) {
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

    function cleanUpLocation() {
        window.location.hash = "";

        if (typeof (history.pushState) !== "undefined") {
            history.pushState("", document.title, location.pathname);
        }
    }

    function navigateToLogin() {

    }

    return {
        metadata: metadata,
        user: user,
        logon: logon,
        logoff: logoff,
        changePassword: changePassword,
        setPassword: setPassword,
        isAuthenticated: isAuthenticated,
        initialize: function () {            
            var fragment = utils.getFragment(),
                externalAccessToken,
                externalError;

            return getMetadata()
                .then(getLoggedInUser);

            function getLoggedInUser() {
                return system.defer(function(dfd) {
                    if (sessionStorage["associatingExternalLogin"]) {
                        sessionStorage.removeItem("associatingExternalLogin");
                        if (typeof (fragment.error) !== "undefined") {
                            externalAccessToken = null;
                            externalError = fragment.error;
                        } else if (typeof (fragment.access_token) !== "undefined") {
                            externalAccessToken = fragment.access_token;
                            externalError = null;
                        } else {
                            externalAccessToken = null;
                            externalError = null;
                        }
                        cleanUpLocation();
                        getUser().then(function (data) {
                            if (data.userName) {
                                window.location.hash = '#profile';
                                addExternalLogin(externalAccessToken).then(dfd.resolve(data));
                            }
                            else
                                dfd.reject();
                        })
                        .fail(dfd.reject);
                    }
                    else if (typeof (fragment.error) !== "undefined") {
                        cleanUpLocation();
                        dfd.reject(new Error(fragment.error));
                    }
                    else if (typeof (fragment.access_token) !== "undefined") {
                        cleanUpLocation();
                        setAccessToken(fragment.access_token);

                        Q.fcall(antiForgeryToken.initToken)
                            .then(getUser().then(dfd.resolve));
                    }
                    else
                        getUser().then(function (data) {
                            dfd.resolve(data);
                        });
                })
                .promise();
            }
        },

        UserModel: UserModel,
        getAccountManagementInfo: getAccountManagementInfo,
        getExternalLoginProviders: getExternalLoginProviders,
        removeLogin: removeLogin
    };
});