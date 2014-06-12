/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides authentication services for the client application.
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
],
function (Q, system, app, router, ko, antiForgeryToken, moment, utils) {
    'use strict';
    
    var user = ko.observable(new UserModel()),
        isAuthenticated = ko.computed(function () {
            return user().isAuthenticated();
        }),
        metadata = {
            lockoutPeriod: 15,
            minRequiredPasswordLength: 6
        },
        logonModuleId = 'viewmodels/login',
        logonRoute = 'login',
        defaultReturnUrl = '';

    /**
     * Initializes the authentication module and 
     * handles external logins.
     */
    function init() {            
        var fragment = utils.getFragment();
        return getMetadata().then(function () {
            return system.defer(function (dfd) {
                if (sessionStorage.associatingExternalLogin)
                    completeAddExternalLogin(dfd, fragment);
                else if (typeof (fragment.error) !== "undefined") 
                    handleExternalLoginError(dfd, fragment);
                else if (typeof (fragment.access_token) !== "undefined")
                    completeExternalLogin(dfd, fragment);
                else
                    getUser().then(dfd.resolve);
            })
            .promise();
        });
    }

    /**
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
    
    /**
     * Gets information about the authenticated user from the server.
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
                    if (error.status === 401) {
                        user(new UserModel(false));
                        dfd.resolve(user());
                    }
                    else
                        dfd.reject(error);
                });
        })
        .promise();
    }

    /**
     * Gets account management data. The data contains things like the login
     * providers available and wether the current user uses those providers or not.
     */
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

    /**
     * Retrieves metadata for registered external login providers.
     */
    function getExternalLoginProviders(returnUrl, generateState) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/externallogins', { method: 'get', data: { returnUrl: returnUrl, generateState: generateState } })
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    /**
     * Associates an external account with the current user.
     */
    function addExternalLogin(externalAccessToken) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/addexternallogin', { method: 'post', data: { externalAccessToken: externalAccessToken } })
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    /**
     * Removes the association of an external account with the current user.
     */
    function removeLogin(loginProvider, providerKey) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/removelogin', { method: 'post', data: { loginProvider: loginProvider, providerKey: providerKey } })
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    /**
     * Sets the local password for the current user.
     */
    function setPassword(data) {
        return system.defer(function (dfd) {
            $.ajax('~/api/account/setpassword', { method: 'post', data: data })
                .then(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
    }

    /**
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

    /**
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

    /**
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

    // Handles ajax events globally and adds authentication tokens.
    $(document).ajaxSend(function (event, request) {
        var accessToken = getAccessToken();
        if (accessToken) {
            request.setRequestHeader('Authorization', "Bearer " + accessToken);
        }
    });

    // Called during initialization depending on a value in sessionStorage 
    // that is set before associating an external login. (e.g. in the profile module)
    function completeAddExternalLogin(dfd, fragment) {
        var externalAccessToken,
            externalError;
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

    // Called during initialization depending on a query string value
    // that is set by external login providers.
    function completeExternalLogin(dfd, fragment) {
        cleanUpLocation();
        setAccessToken(fragment.access_token);
        Q.fcall(antiForgeryToken.initToken)
            .then(getUser)
            .then(function (data) {
                restoreLogonSuccessRoute();
                router.redirectFromLogonView();
                dfd.resolve(data);
            });
    }

    // Called during initialization depending on a query string value
    // that is set by external login providers.
    function handleExternalLoginError(dfd, fragment) {
        cleanUpLocation();
        dfd.reject(new Error(fragment.error));
    }

    function setAccessToken(token, rememberMe) {
        var storage = rememberMe ? localStorage : sessionStorage;
        storage.accessToken = token;
    }

    function getAccessToken() {
        return sessionStorage.accessToken || localStorage.accessToken;
    }

    function clearAccessToken() {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
    }

    function restoreLogonSuccessRoute() {
        var lsr = localStorage.logonSuccessRoute;
        if (lsr) {
            localStorage.removeItem('logonSuccessRoute');
            window.location.hash = lsr;
        }
    }

    function cleanUpLocation() {
        window.location.hash = "";

        if (typeof (history.pushState) !== 'undefined') {
            history.pushState('', document.title, location.pathname);
        }
    }

    function _logonResponseToDisplayMessage(response) {
        var defaultMessage = 'Die Anmeldung ist fehlgeschlagen. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin besteht.';
        if (response) {
            var err = response.Error;
            if (err) {
                if (err === 'ERROR_LOCKED') {
                    var message = 'Dein Konto wurde aufgrund zu vieler ungültiger Anmelde-Versuche gesperrt. Die Sperrung wird nach {0} Minuten automatisch aufgehoben.';
                    return message.replace(/\{0\}/gi, metadata.lockoutPeriod);
                }
                if (err === 'ERROR_NOTAPPROVED')
                    return 'Dein Konto wurde noch nicht bestätigt.';
                if (err === 'ERROR_USER_OR_PASSWORD_INVALID')
                    return 'Der Benutzername oder das Passwort sind ungültig.';
                if (err === 'Bad request')
                    return defaultMessage;
            }
        }
        return response.Error || defaultMessage;
    }


    /**
     * Redirects to the logon view.
     */
    router.logon = function (routeInfo) {
        if (routeInfo.config.moduleId === logonModuleId)
            throw new Error('The logon-Function may not be called with the logon-route.');
        router.logonSuccessRoute = routeInfo;
        return logonRoute;
    };

    /** 
     * Navigates to the original route after a successful logon.
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

    /**
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

    /**
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


    /**
     * UserModel class
     */
    function UserModel(isAuthenticated, userName, roles, data, expiration) {
        var self = this;
        data = data || {};

        self.expirationTicket = new ExpirationTicket(expiration);
        self.isAuthenticated = ko.observable(isAuthenticated || false);
        self.userName = ko.observable(userName || '');
        self.roles = ko.observable(roles || []);
        self.creationDate = ko.observable(data.creationDate || new Date());
        self.lastPasswordChangedDate = ko.observable(data.lastPasswordChangedDate);

        self.firstName = ko.observable(data.firstName || '');
        self.lastName = ko.observable(data.lastName || '');

        self.displayName = ko.computed(function () {
            if (self.firstName().length > 0)
                return self.firstName();
            else if (self.lastName().length > 0)
                return self.lastName();
            else
                return self.userName();
        });

        self.fullName = ko.computed(function () {
            return '{0} {1}'
                .replace(/\{0\}/, self.firstName())
                .replace(/\{1\}/, self.lastName()).trim();
        });

        self.hasEverChangedPassword = ko.computed(function () {
            return self.lastPasswordChangedDate() > self.creationDate();
        });

        self.isInRole = function (roleName) {
            for (var i = 0; i < this.roles().length; i++) {
                if (self.roles()[i] === roleName) return true;
            }
            return false;
        };

        self.isInAnyRole = function (roleNames) {
            if (!roleNames || roleNames.length === 0)
                return true;
            for (var i = 0; i < roleNames.length; i++) {
                if (self.isInRole(roleNames[i])) return true;
            }
            return false;
        };
    }

    UserModel.prototype.isExpired = function () {
        return this.expirationTicket.isExpired();
    };
        
    /**
     * ExpirationTicket class
     */
    function ExpirationTicket(expiration) {
        this.created = new Date();
        this.expiration = expiration || false;
    }

    ExpirationTicket.prototype.isExpired = function () {
        if (!this.expiration) return false;
        return moment(this.created).add('seconds', this.expiration) < new Date();
    };

    
    return {
        initialize: init,
        metadata: metadata,
        user: user,
        logon: logon,
        logoff: logoff,
        changePassword: changePassword,
        setPassword: setPassword,
        isAuthenticated: isAuthenticated,

        UserModel: UserModel,
        getAccountManagementInfo: getAccountManagementInfo,
        getExternalLoginProviders: getExternalLoginProviders,
        removeLogin: removeLogin
    };
});