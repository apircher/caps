define(function (require) {

    var authentication = require('authentication'),
        app = require('durandal/app'),
        system = require('durandal/system'),
        router = require('plugins/router'),
        ko = require('knockout'),
        $ = require('jquery');

    var userName = ko.observable().extend({ required: true }),
        password = ko.observable().extend({ required: true }),
        rememberMe = ko.observable(false),
        userNameFocused = ko.observable(false),
        isLoggingOn = ko.observable(false),
        isLoadingExternalLoginProviders = ko.observable(false),
        externalLoginProviders = ko.observableArray();

    function logon() {
        isLoggingOn(true);
        var returnRoute = authentication.logon(userName(), password(), rememberMe())
        .then(function (result) {            
            router.redirectFromLogonView();
        })
        .fail(function (err) {
            app.showMessage(err.responseJSON.error_description, 'Fehlgeschlagen');
        })
        .done(function () {
            isLoggingOn(false);
        });
    }

    function reset() {
        userName(null);
        password(null);
        rememberMe(false);
    }

    function setFocus() {
        var loginForm = $('#login-form');
        $('.autofocus', loginForm).each(function () {
            $(this).focus();
        });
    }

    function loadExternalLoginProviders() {
        isLoadingExternalLoginProviders(true);
        authentication.getExternalLoginProviders('/', true).then(function (data) {
            var vms = ko.utils.arrayMap(data, function (item) {
                return new ExternalLoginProviderViewModel(item);
            });
            externalLoginProviders(vms);
            isLoadingExternalLoginProviders(false);
        });
    }
    
    var vm = {
        userName: userName,
        password: password,
        rememberMe: rememberMe,
        logon: logon,
        isBusy: ko.computed(function () {
            return isLoggingOn() || router.isNavigating();
        }),
        userNameFocused: userNameFocused,
        activate: function () {
            reset();
            loadExternalLoginProviders();
            setFocus();
        },
        compositionComplete: function (view) {
            setFocus();
        },
        isLoadingExternalLoginProviders: isLoadingExternalLoginProviders,
        externalLoginProviders: externalLoginProviders
    };

    ko.validation.group(vm);
    return vm;


    function ExternalLoginProviderViewModel(data) {
        var self = this;

        // Data
        self.name = ko.observable(data.name);

        // Operations
        self.login = function () {
            sessionStorage["state"] = data.state;
            sessionStorage["loginUrl"] = data.url;
            // IE doesn't reliably persist sessionStorage when navigating to another URL. Move sessionStorage temporarily
            // to localStorage to work around this problem.
            app.archiveSessionStorageToLocalStorage();
            window.location = data.url;
        };
    }
});