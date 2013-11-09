define(['durandal/app', 'durandal/system', 'plugins/dialog'], function (app, system, dialog) {

    var siteMapNodeSelection = {
        dialogViewModelCtor: undefined,
        install: function () {
            app.selectSiteMapNode = function (options) {
                return system.defer(function (dfd) {
                    showDialog(options, dfd);
                }).promise();
            };
        },

        registerDialog: registerDialog
    };

    function registerDialog(dialogViewModelCtor) {
        siteMapNodeSelection.dialogViewModelCtor = dialogViewModelCtor;
    }

    function showDialog(options, dfd) {
        options = options || {};

        if (!siteMapNodeSelection.dialogViewModelCtor) {
            system.log('siteMapNodeSelection: No Dialog Model/View registered.');
            dfd.reject();
        }

        if (options.module) {
            options.module.showDialog(new siteMapNodeSelection.dialogViewModelCtor(options))
                .then(dfd.resolve);
        }
    }

    return siteMapNodeSelection;
});