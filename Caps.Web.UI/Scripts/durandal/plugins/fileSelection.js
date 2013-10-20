define(['durandal/app', 'durandal/system', 'plugins/dialog'], function (app, system, dialog) {

    var DialogVM;

    function registerDialog(vmConstructorFunction) {
        DialogVM = vmConstructorFunction;
    }

    var fileService = {
        install: function () {
            app.selectFiles = function (module) {
                if (!DialogVM) {
                    system.log('fileSelection: No Dialog Model/View registered.');
                    return;
                }
                if (module)
                    return module.showDialog(new DialogVM());
            };
        },

        registerDialog: registerDialog
    };

    return fileService;
});