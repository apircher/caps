/*
 * moduleFactory.js
 */
define([
    'ko',
    'plugins/dialog',
    'durandal/events'
],
function (ko, dialog, Events) {

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

    CapsModule.prototype.initializeRouter = function () {
    };

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

    function createModule(routeConfig) {
        routeConfig.hasUnsavedChanges = routeConfig.hasUnsavedChanges || ko.observable(false);
        var m = new CapsModule(routeConfig);
        Events.includeIn(m);
        return m;
    }

    return {
        createModule: createModule,
        CapsModule: CapsModule
    };
});