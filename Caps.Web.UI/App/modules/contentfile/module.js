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
    './viewmodels/uploadManager',
    './datacontext',
    './viewmodels/fileUploadDialog'
],
function (moduleFactory, routerFactory, model, app, UploadManager, datacontext, FileUploadDialog) {
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

    app.uploadManager = new UploadManager({
        beforeUpload: function (files, callback) {
            var fileNames = ko.utils.arrayMap(files, function (f) { return f.name; });
            datacontext.getFileInfo(fileNames).then(function (result) {
                var existingFiles = ko.utils.arrayFilter(result, function (r) { return r.count > 0; });
                if (existingFiles.length > 0) {
                    var dlgVm = new FileUploadDialog(result);
                    app.showDialog(dlgVm).then(function (dialogResult) {
                        if (dialogResult)
                            callback(dialogResult, existingFiles);
                    });
                }
                else
                    callback();
            });
        }
    });
                
    return module;
});