/*
 * moduleLoader.js
 */
define([
    'durandal/system',
    './moduleRegistry',
    'Q'
],
function (system, registry, Q) {

    function convertNameToModuleId(name) {
        return 'modules/' + name + '/module';
    }
    
    return {
        loadModules: function (names) {
            var promises = [],
                promise;
            if (system.isArray(names)) {
                for (var i = 0; i < names.length; i++) {
                    promise = this.loadModule(names[i]);
                    if (promise) promises.push(promise);
                }
            }
            else if (system.isString(names)) {
                promise = this.loadModule(names);
                if (promise) promises.push(promise);
            }
            return Q.all(promises);
        },

        loadModule: function (name) {
            if (!system.isString(name))
                throw new Error('The parameter name has to be a string.');
            return require([convertNameToModuleId(name)], function (module) {
                module.moduleName = name;
                registry.registerModule(module);
            });
        }
    };

});