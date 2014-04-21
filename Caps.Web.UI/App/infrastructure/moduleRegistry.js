/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/*
 * Provides a global registry for cms modules.
 */
define([
    'durandal/system',
    'ko'
],
function (system, ko) {
    'use strict';

    var modules = ko.observableArray();

    function registerModule(module) {
        if (module.routeConfig)
            system.log('register module ' + module.routeConfig.title);
        modules.push(module);
    }

    return {
        modules: modules,
        registerModule: registerModule
    };

});