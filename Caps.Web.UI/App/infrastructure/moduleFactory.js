/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a factory for creating cms modules.
 */
define([
    'ko',
    'plugins/dialog',
    'durandal/events'
],
function (ko, dialog, Events) {
    'use strict';

    /**
     * Creates a cms module with the given route configuration.
     */
    function createModule(routeConfig) {
        routeConfig.hasUnsavedChanges = routeConfig.hasUnsavedChanges || ko.observable(false);
        var m = new CapsModule(routeConfig);
        Events.includeIn(m);
        routeConfig.hasLongRunningTasks = ko.computed({ read: function () { return m.hasLongRunningTasks(); }, deferEvaluation: true });
        routeConfig.taskInfo = ko.computed({ read: function () { return m.taskInfo(); }, deferEvaluation: true });
        return m;
    }

    /**
     * CapsModule class
     */
    function CapsModule (routeConfig) {
        this.routeConfig = routeConfig;
        this.dialogContext = undefined;
    }

    CapsModule.prototype.activate = function () {
        this.trigger('module:activate', this);
    };

    CapsModule.prototype.deactivate = function () {
        this.trigger('module:deactivate', this);
    };

    CapsModule.prototype.initializeRouter = function () { };

    CapsModule.prototype.getDialogContextName = function () {
        return this.moduleName + '_DialogContext';
    };

    CapsModule.prototype.initializeDialogContext = function () {
        var self = this,
            rootElementId = '#' + self.moduleName + 'Module';

        this.dialogContext = {
            addHost: function (theDialog) {
                var $pageHost = $(rootElementId),
                    $children = $pageHost.children(':visible'),
                    $dialogHost = $('<div class="pageDialogHost"></div>').appendTo($pageHost);

                theDialog.host = $dialogHost.get(0);
                theDialog.hiddenControls = $children;

                $children.hide();
                $dialogHost.show();
            },
            removeHost: function (theDialog) {
                var $pageHost = $(rootElementId),
                    $dialogHost = $(theDialog.host);

                $dialogHost.hide();
                theDialog.hiddenControls.show();

                setTimeout(function () {
                    ko.removeNode(theDialog.host);
                }, 200);
            },
            compositionComplete: function (child, parent, context) {

            }
        };
        dialog.addContext(this.getDialogContextName(), this.dialogContext);
    };

    CapsModule.prototype.showDialog = function (vm, activationData) {
        if (!this.dialogContext)
            this.initializeDialogContext();
        return dialog.show(vm, activationData, this.getDialogContextName());
    };

    CapsModule.prototype.hasLongRunningTasks = function () {
        return false;
    };

    CapsModule.prototype.taskInfo = function () {
        return {
            count: 0,
            progress: 0
        };
    };

    return {
        createModule: createModule,
        CapsModule: CapsModule
    };
});