define(['infrastructure/moduleFactory', 'infrastructure/moduleRouter'], function (moduleFactory, routerFactory) {

    var module = moduleFactory.createModule({
        route: 'drafts*details',
        moduleId: 'modules/draft/module',
        title: 'Entwürfe',
        nav: 20,
        hash: '#drafts'
    });

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/draft', 'drafts')
            .map([
                { route: '', moduleId: 'viewmodels/index', title: 'Entwürfe', nav: false }
            ])
            .buildNavigationModel();
    };

    return module;
});