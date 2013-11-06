define(['infrastructure/moduleFactory', 'infrastructure/moduleRouter'], function (moduleFactory, routerFactory) {

    var module = moduleFactory.createModule({
        route: 'sitemap*details',
        moduleId: 'modules/sitemap/module',
        title: 'Sitemap',
        nav: 10,
        hash: '#sitemap'
    });

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/sitemap', 'sitemap')
            .map([
                { route: '', moduleId: 'viewmodels/index', title: 'Sitemap', nav: false },
                { route: 'edit/:sitemapNodeId', moduleId: 'viewmodels/editor', title: 'Knoten bearbeiten', nav: false },
                { route: 'translate/:sitemapNodeId/:language', moduleId: 'viewmodels/translator', title: 'Übersetzung', nav: false }
            ])
            .buildNavigationModel();
    };

    return module;
});