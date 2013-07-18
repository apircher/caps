﻿define(function (require) {

    var system = require('durandal/system'),
        ko = require('knockout');

    var modules = ko.observableArray();

    function registerModule(module) {
        system.log('register module ' + module.title);
        modules.push(module);
    }

    return {
        modules: modules,
        registerModule: registerModule
    };

});