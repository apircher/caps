define(['infrastructure/moduleFactory', 'infrastructure/moduleRouter', './entities'], function (moduleFactory, routerFactory, model) {

    var module = moduleFactory.createModule({
        route: 'drafts*details',
        moduleId: 'modules/draft/module',
        title: 'Entwürfe',
        nav: 20,
        hash: '#drafts'
    });

    module.extendModel = model.extendModel;

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/draft', 'drafts')
            .map([
                { route: '', moduleId: 'viewmodels/index', title: 'Entwürfe', nav: false },
                { route: 'create', moduleId: 'viewmodels/editor', title: 'Editor', nav: false },
                { route: 'edit/:draftId', moduleId: 'viewmodels/editor', title: 'Editor', nav: false }
            ])
            .buildNavigationModel();
    };

    return module;
});