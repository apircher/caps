
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
    'knockout.validation', 'localization', 'infrastructure/moduleLoader', 'infrastructure/moduleRegistry', 'plugins/router', 'jquery', 'entityManagerProvider', 'infrastructure/serverUtil', 'durandal/composition',
    'knockout.extenders', 'infrastructure/validation', '../Scripts/safari.cancelZoom', 'infrastructure/contentEditing'],
    function (app, viewLocator, system, Q, authentication, antiForgeryToken, validation, localization, moduleLoader, moduleRegistry, router, $, entityManagerProvider, serverUtil, composition) {
        'use strict';
        
        //>>excludeStart("build", true);
        system.debug(true);
        //>>excludeEnd("build");

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

        $(document).ajaxSend(function (event, request, settings) {
            settings.url = serverUtil.mapPath(settings.url);
        });

        addStorageUtils(app);
        app.restoreSessionStorageFromLocalStorage();

        // Handle unloading
        $(window).bind('beforeunload', onBeforeUnload);

        app.title = 'CAPS';

        app.configurePlugins({
            router: true,
            dialog: true,
            widget: true,
            fileSelection: true,
            siteMapNodeSelection: true,
            contentSelection: true
        });

        // Initialize Knockout Validation
        validation.init({
            insertMessages: false
        });

        // Localize
        localization.localize('de');

        // Register binding handlers for deferred execution
        composition.addBindingHandler('forceViewportHeight');

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

            ko.utils.arrayForEach(moduleRegistry.modules(), function (module) {
                if (module.routeConfig.hasUnsavedChanges()) {
                    options.cancel = true;
                    options.message = 'Das Modul ' + module.routeConfig.title + ' enthält ungespeicherte Änderungen.';
                    module.router.navigateToModule();
                    return false;
                }
            });

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

        function addStorageUtils(app) {
            app.archiveSessionStorageToLocalStorage = function () {
                var backup = {};

                for (var i = 0; i < sessionStorage.length; i++) {
                    backup[sessionStorage.key(i)] = sessionStorage[sessionStorage.key(i)];
                }

                localStorage["sessionStorageBackup"] = JSON.stringify(backup);
                sessionStorage.clear();
            };

            app.restoreSessionStorageFromLocalStorage = function () {
                var backupText = localStorage["sessionStorageBackup"],
                    backup;

                if (backupText) {
                    backup = JSON.parse(backupText);

                    for (var key in backup) {
                        sessionStorage[key] = backup[key];
                    }

                    localStorage.removeItem("sessionStorageBackup");
                }
            };
        }
    });