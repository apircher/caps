define(['durandal/app', 'durandal/system', 'plugins/dialog'], function (app, system, dialog) {

    var DialogVM;

    function registerDialog(vmConstructorFunction) {
        DialogVM = vmConstructorFunction;
    }

    var fileService = {
        install: function () {
            app.selectFiles = function (options) {
                return system.defer(function (dfd) {
                    options = options || {};

                    if (!DialogVM) {
                        system.log('fileSelection: No Dialog Model/View registered.');
                        dfd.reject();
                    }

                    if (options.module) {
                        options.module.showDialog(new DialogVM(options)).then(dfd.resolve);
                    }

                }).promise();
            };
        },

        registerDialog: registerDialog
    };

    return fileService;
});