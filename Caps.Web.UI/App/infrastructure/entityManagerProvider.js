/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Returns properly configured breeze entity manager instances.
 */
define([
    'breeze',
    'infrastructure/moduleRegistry'
],
function (breeze, moduleRegistry) {
    'use strict';

    var serviceName = '~/breeze/capsdata',
        masterManager = new breeze.EntityManager(serviceName);

    //TODO: configure the metadataStore with entity type extensions.

    var provider = {
        createManager: createManager,
        initialize: initialize,
        refresh: refresh
    };
    return provider;

    function createManager() {
        var manager = masterManager.createEmptyCopy();

        //TODO: copy picklists,... from masterManager

        return manager;
    }

    function initialize() {

        //TODO: load masterManager with lookup entities and any other startup data. Returns a promise.

        var modules = moduleRegistry.modules();
        for (var i = 0; i < modules.length; i++) {
            var func = modules[i].extendModel;
            if (func && typeof func === 'function') 
                func.call(modules[i], masterManager.metadataStore);            
        }
        return masterManager.fetchMetadata();
    }

    function refresh() {

        //TODO: refresh cached entities. Typically a subset of the initialize function.

    }
});