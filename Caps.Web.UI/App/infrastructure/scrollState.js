/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'ko',
    'durandal/composition'
],
function (ko, composition) {
    'use strict';

    /**
     * ScrollState class
     */
    function ScrollState(module) {
        var self = this,
            isActive = ko.observable(false),
            isModuleEnabled = ko.observable(true);

        self.scrollTop = ko.observable();

        self.isActive = isActive;

        self.isEnabled = ko.computed(function() {
            return isActive() && isModuleEnabled();
        });

        self.activate = function () {
            isActive(true);
        };

        self.deactivate = function () {
            isActive(false);
        };

        module.on('module:activate', function () {
            if (isActive()) {
                composition.current.complete(function () {
                    isModuleEnabled(true);
                });
            }
        });

        module.on('module:deactivate', function () {
            if (isActive()) isModuleEnabled(false);
        });
    }

    return ScrollState;

});