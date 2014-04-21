/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a module-specific keyboard handler that processes
 * keyboard events only when the given module is active.
 */
define([
    'jquery',
    'ko',
    'durandal/system'
],
function ($, ko, system) {
    'use strict';

    var $window = $(window);

    /**
     * KeyboardHandler class.
     */
    function KeyboardHandler(module) {
        var self = this,
            isActive = ko.observable(false);

        self.activate = function () {
            isActive(true);
            attachKeyHandler();
        };

        self.deactivate = function () {
            isActive(false);
            detachKeyHandler();
        };

        self.isActive = isActive;

        function attachKeyHandler() {
            $window.on('keydown', handleKeyDown);
        }

        function detachKeyHandler() {
            $window.off('keydown', handleKeyDown);
        }

        function handleKeyDown(e) {
            if (system.isFunction(self.keydown))
                self.keydown.call(self, e);
        }

        module.on('module:activate', function () {
            if (isActive()) attachKeyHandler();
        });

        module.on('module:deactivate', function () {
            if (isActive()) detachKeyHandler();
        });
    }

    KeyboardHandler.prototype.keydown = function (e) {
        system.log('Keydown: ' + e.keyCode);
    };

    return KeyboardHandler;
});