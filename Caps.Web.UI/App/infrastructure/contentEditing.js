/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a registry of editors for various content types. 
 * The module extends the application object by adding functions
 * for registring new content editors and for editing content
 * of a given type.
 */
define([
    'durandal/app'
],
function (app) {
    'use strict';

    var registry = {};

    var vm = {
        registerEditor: function (entityType, module, editCallback) {
            registry[entityType] = {
                entityType: entityType,
                module: module,
                edit: editCallback
            };
        },

        findEditor: function(entityType) {
            return registry[entityType];
        }
    };

    /**
     * Navigates to the editor registered for the given entity type.
     */
    app.editContent = function (entityType, entityKey) {
        var editor = vm.findEditor(entityType);
        if (editor) {
            editor.edit(entityKey);
        }
    };

    /**
     * Registers an editor for a given entity type.
     */
    app.registerContentEditor = function (entityType, module, editCallback) {
        vm.registerEditor(entityType, module, editCallback);
    };

    return vm;
});