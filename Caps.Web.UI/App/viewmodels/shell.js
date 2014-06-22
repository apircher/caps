/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Defines the view model for the application shell.
 */
define([
    'plugins/router',
    'durandal/app',
    'authentication',
    'infrastructure/moduleRouter',
    'infrastructure/moduleRegistry',
    'ko'
],
function (router, app, authentication, moduleRouter, moduleRegistry, ko) {
    'use strict';

    return {
        router: router,
        authentication: authentication,

        activate: function () {
            //configure routing
            router.map([
                    { route: '', moduleId: 'viewmodels/welcome', title: 'Willkommen', nav: false },
                    { route: 'login', moduleId: 'viewmodels/login', title: 'Anmelden', nav: false },
                    { route: 'forbidden', moduleId: 'viewmodels/forbidden', title: 'Nicht erlaubt', nav: false },
                    { route: 'profile', moduleId: 'viewmodels/profile', title: 'Profildaten', nav: false, hash: '#profile' },
                    { route: 'website', moduleId: 'viewmodels/websites', title: 'Website', nav: false },
                    { route: 'templates/:websiteId/create', moduleId: 'viewmodels/templateEditor', title: 'Vorlage erstellen', nav: false },
                    { route: 'templates/:websiteId/edit/:id', moduleId: 'viewmodels/templateEditor', title: 'Vorlage bearbeiten', nav: false }
            ]);
            return moduleRouter.mapModuleRoutes(router)
                .buildNavigationModel()
                .activate();
        },

        navigationItemTemplate: function (item) {
            return (item.isModuleRoute && item.isModuleRoute === true) ? 'module-tile' : 'default-tile';
        },

        navigationItems: ko.computed(function () {
            return ko.utils.arrayFilter(router.navigationModel(), function (item) {
                return authentication.isAuthenticated() && (!item.roles || authentication.user().isInAnyRole(item.roles));
            });
        }),

        showModule: function (item) {
            require([item.moduleId], function (module) {
                module.router.navigateToModule();
            });
        },

        logOff: function () {
            if (authentication.isAuthenticated() === true)
                authentication.logoff().then(router.navigate('login', { trigger: true, replace: true }));
        }
    };
});