define([
    'infrastructure/moduleFactory',
    'infrastructure/moduleRouter',
    './entities',
    'durandal/app'
],
function (moduleFactory, routerFactory, model, app) {

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
                
    return module;
});