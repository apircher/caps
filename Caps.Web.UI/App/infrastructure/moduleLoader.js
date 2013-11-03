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
            var promises = [];
            if (system.isArray(names)) {
                for (var i = 0; i < names.length; i++) {
                    var p = this.loadModule(names[i]);
                    if (p) promises.push(p);
                }
            }
            else if (system.isString(names)) {
                var p = this.loadModule(names);
                if (p) promises.push(p);
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