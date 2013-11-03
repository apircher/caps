/*
 * moduleRegistry.js
 */
define([
    'durandal/system',
    'ko'
],
function (system, ko) {
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