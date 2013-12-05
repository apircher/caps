define(['durandal/app', 'durandal/system', 'plugins/dialog'], function (app, system, dialog) {

    var contentSelection = {
        dialogViewModelCtor: undefined,
        install: function () {
            app.selectContent = function (options) {
                return system.defer(function (dfd) {
                    showDialog(options, dfd);
                }).promise();
            };
        },

        registerDialog: registerDialog
    };

    function registerDialog(entityType, dialogViewModelCtor) {
        contentSelection.dialogViewModelCtor = dialogViewModelCtor;
    }

    function showDialog(options, dfd) {
        options = options || {};

        if (!contentSelection.dialogViewModelCtor) {
            system.log('contentSelection: No Dialog Model/View registered.');
            dfd.reject();
        }

        if (options.module) {
            options.module.showDialog(new contentSelection.dialogViewModelCtor(options))
                .then(dfd.resolve);
        }
    }

    return contentSelection;
});