define(['infrastructure/moduleFactory', 'infrastructure/moduleRouter'], function (moduleFactory, routerFactory) {

    var module = moduleFactory.createModule({
        route: 'files*details',
        moduleId: 'modules/contentfile/module',
        title: 'Dateien',
        nav: 30,
        hash: '#files'
    });

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/contentfile', 'files')
            .map([
                { route: '', moduleId: 'viewmodels/index', title: 'Dateien', nav: false }
            ])
            .buildNavigationModel();
    };

    return module;
});