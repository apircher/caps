define(['infrastructure/moduleFactory', 'infrastructure/moduleRouter', './entities'], function (moduleFactory, routerFactory, model) {

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
                { route: 'detail/:fileId', moduleId: 'viewmodels/detail', title: 'Details', nav: false },
            ])
            .buildNavigationModel();
    };

    return module;
});