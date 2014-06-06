/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Represents a module to manage content files.
 */
define([
    'infrastructure/moduleFactory',
    'infrastructure/moduleRouter',
    './entities',
    'durandal/app',
    './viewmodels/uploadManager'
],
function (moduleFactory, routerFactory, model, app, UploadManager) {
    'use strict';

    var module = moduleFactory.createModule({
        route: 'files*details',
        moduleId: 'modules/contentfile/module',
        title: 'Dateien',
        nav: 30,
        hash: '#files'        
    });

    module.extendModel = model.extendModel;

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/contentfile', 'files')
            .map([
                { route: '', moduleId: 'viewmodels/index', title: 'Dateien', nav: false },
                { route: 'detail/:fileId', moduleId: 'viewmodels/detail', title: 'Details', nav: false }
            ])
            .buildNavigationModel();                
    };

    module.hasLongRunningTasks = function () {
        return app.uploadManager.isUploading();
    };

    module.taskInfo = function () {
        return {
            count: app.uploadManager.currentUploads().length,
            progress: app.uploadManager.progress()
        };
    };

    app.on('caps:started', function () {
        require(['modules/contentfile/viewmodels/fileSelectionDialog'], function (FileSelectionDialog) {
            FileSelectionDialog.install();
        });
    });

    app.on('caps:contentfile:navigateToFile', function (file) {
        if (file) {
            module.router.navigate('#files/detail/' + file.Id());
        }
    });

    app.uploadManager = new UploadManager();
                
    return module;
});