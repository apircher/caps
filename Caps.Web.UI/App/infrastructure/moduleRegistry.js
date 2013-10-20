define(function (require) {

    var system = require('durandal/system'),
        ko = require('knockout');

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