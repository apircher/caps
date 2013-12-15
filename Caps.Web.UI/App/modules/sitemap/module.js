define(['durandal/app', 'infrastructure/moduleFactory', 'infrastructure/moduleRouter', './entities'], function (app, moduleFactory, routerFactory, model) {

    var module = moduleFactory.createModule({
        route: 'sitemap*details',
        moduleId: 'modules/sitemap/module',
        title: 'Sitemap',
        nav: 10,
        hash: '#sitemap'
    });
    
    module.extendModel = model.extendModel;

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/sitemap', 'sitemap')
            .map([
                { route: '', moduleId: 'viewmodels/index', title: 'Sitemap', nav: false },
                { route: 'edit/:siteMapNodeId', moduleId: 'viewmodels/editor', title: 'Knoten bearbeiten', nav: false },
                { route: 'translate/:siteMapNodeId/:language', moduleId: 'viewmodels/translator', title: 'Übersetzung', nav: false }
            ])
            .buildNavigationModel();
    };

    app.on('caps:started', function () {
        require(['modules/sitemap/viewmodels/siteMapNodeSelectionDialog'], function (SiteMapNodeSelectionDialog) {
            SiteMapNodeSelectionDialog.install();
        });
    });

    app.on('caps:contentfile:navigateToResourceOwner', function (resource) {
        if (resource.PublicationFile) {
            module.router.navigate('#sitemap?p=' + resource.PublicationFile().PublicationId());
        }
    });

    return module;
});