﻿define(function (require) {

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
        isLoggingOn = ko.observable(false);

    function logon() {
        isLoggingOn(true);
        var returnRoute = authentication.logon(userName(), password(), rememberMe())
        .then(function (result) {            
            router.redirectFromLogonView();
        })
        .fail(function (err) {
            app.showMessage(err.Error || err.message, 'Fehlgeschlagen');
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
            setFocus();
        },
        compositionComplete: function (view) {
            setFocus();
        }
    };

    ko.validation.group(vm);
    return vm;
});