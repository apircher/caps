
requirejs.config({
    paths: {
        'text': '../Scripts/text',
        'durandal': '../Scripts/durandal',
        'plugins': '../Scripts/durandal/plugins',
        'transitions': '../Scripts/durandal/transitions',

        'entityManagerProvider': 'infrastructure/entityManagerProvider',
        'authentication': 'infrastructure/authentication',
        'localization': 'infrastructure/localization',

        'knockout.extenders': '../Scripts/knockout.extenders',        
        'typeahead': '../Scripts/typeahead',
        'moment': '../Scripts/moment',
        'doubleTap': '../Scripts/doubleTap'
    },
    map: {
        '*': {
            'ko': 'knockout'
        }
    }
});

define('jquery', function () { return jQuery; });
define('knockout', ko);
define('knockout.validation', ko.validation);
define('Q', function () { return Q; });
define('breeze', function () { return breeze; });
define('markdown', function () { return Markdown; });
define('toastr', function () { return toastr; });

define(['durandal/app', 'durandal/viewLocator', 'durandal/system', 'Q', 'authentication', 'infrastructure/antiForgeryToken',
    'knockout.validation', 'localization', 'infrastructure/moduleLoader', 'plugins/router', 'jquery', 'entityManagerProvider',
    'knockout.extenders', 'infrastructure/validation', '../Scripts/safari.cancelZoom'],
    function (app, viewLocator, system, Q, authentication, antiForgeryToken, validation, localization, moduleLoader, router, $, entityManagerProvider) {

        //>>excludeStart("build", true);
        system.debug(true);
        //>>excludeEnd("build");

        app.title = 'CAPS';

        app.configurePlugins({
            router: true,
            dialog: true,
            widget: true,
            fileSelection: true,
            siteMapNodeSelection: true
        });

        // Plug Q´s promise mechanism into Durandal.
        system.defer = function (action) {
            var deferred = Q.defer();
            action.call(deferred, deferred);
            var promise = deferred.promise;
            deferred.promise = function() {
                return promise;
            };
            return deferred;
        };

        // Initialize Knockout Validation
        validation.init({
            insertMessages: false
        });

        // Localize
        localization.localize('de');

        // Handle unloading
        $(window).bind('beforeunload', onBeforeUnload);

        // Initialize application
        Q.fcall(antiForgeryToken.initToken)
            .then(authentication.initialize)
            .then(moduleLoader.loadModules(['sitemap', 'draft', 'contentfile', 'user']))
            .then(entityManagerProvider.initialize)
            .then(app.start)
            .then(function () {
                // Replace 'viewmodels' in the moduleId with 'views' to locate the view.
                // Look for partial views in a 'views' folder in the root.
                viewLocator.useConvention();
                // Override default MessageBox Template
                setDefaultMessageBoxTemplate();
                // Show the app by setting the root view model for our application with a transition.
                app.setRoot('viewmodels/shell', 'entrance');
                app.trigger('caps:started');
            })
            .done();

        function onBeforeUnload() {
            var options = {
                message: 'Mindestens ein Bereich enthält ungespeicherte Änderungen.',
                cancel: false
            };
            app.trigger('app:beforeunload', options);
            if (options.cancel)
                return options.message;
        }

        function setDefaultMessageBoxTemplate() {
            require(['plugins/dialog'], function (dialog) {
                dialog.MessageBox.defaultViewMarkup = [
                    '<div data-view="plugins/messageBox" class="messageBox">',
                        '<div class="modal-header">',
                            '<h4 data-bind="text: title"></h4>',
                        '</div>',
                        '<div class="modal-body">',
                            '<p class="message" data-bind="text: message"></p>',
                        '</div>',
                        '<div class="modal-footer" data-bind="foreach: options">',
                            '<button class="btn" data-bind="click: function () { $parent.selectOption($data); }, text: $data, css: { \'btn-primary\': $index() == 0, \'btn-default\': $index() != 0, autofocus: $index() == 0 }"></button>',
                        '</div>',
                    '</div>'
                ].join('\n');
            });
        }
    });