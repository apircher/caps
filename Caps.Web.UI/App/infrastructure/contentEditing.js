define(['durandal/app'], function (app) {

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

    app.editContent = function (entityType, entityKey) {
        var editor = vm.findEditor(entityType);
        if (editor) {
            editor.edit(entityKey);
        }
    };

    app.registerContentEditor = function (entityType, module, editCallback) {
        vm.registerEditor(entityType, module, editCallback);
    };

    return vm;
});