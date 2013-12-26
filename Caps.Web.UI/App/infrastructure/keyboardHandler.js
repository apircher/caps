define(['jquery', 'ko', 'durandal/system'], function ($, ko, system) {

    var $window = $(window);

    function KeyboardHandler(module) {
        var self = this,
            isActive = ko.observable(false);

        module.on('module:activate', function () {
            if (isActive()) 
                attachKeyHandler();
        });

        module.on('module:deactivate', function () {
            if (isActive())
                detachKeyHandler();
        });

        self.isActive = isActive;
        self.activate = function () {
            isActive(true);
            attachKeyHandler();
        };
        self.deactivate = function () {
            isActive(false);
            detachKeyHandler();
        };

        function attachKeyHandler() {
            $window.on('keydown', handleKeyDown);
        }

        function detachKeyHandler() {
            $window.off('keydown', handleKeyDown);
        }

        function handleKeyDown(e) {
            var h = self.keydown;
            if (system.isFunction(h))
                h.call(self, e);
        }
    }

    KeyboardHandler.prototype.keydown = function (e) {
        system.log('Keydown: ' + e.keyCode);
    };

    return KeyboardHandler;
});