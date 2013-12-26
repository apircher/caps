define(['ko', 'durandal/composition'], function (ko, composition) {

    function ScrollState(module) {
        var self = this,
            isActive = ko.observable(false),
            isModuleEnabled = ko.observable(true);

        self.scrollTop = ko.observable();

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
    }

    return ScrollState;

});