define(['infrastructure/moduleFactory', 'infrastructure/moduleRouter'], function (moduleFactory, routerFactory, ko) {
    
    var module = moduleFactory.createModule({
        route: 'users*details',
        moduleId: 'modules/user/module',
        title: 'Benutzer',
        nav: 40,
        hash: '#users',
        roles: ['Administrator']
    });

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/user', 'users')
            .map([
                { route: '', moduleId: 'viewmodels/dashboard', title: 'Benutzerverwaltung', nav: false },
                { route: 'detail/:userName', moduleId: 'viewmodels/userDetail', title: 'Benutzerdetails', nav: false },
                { route: 'edit/:userName', moduleId: 'viewmodels/userEditor', title: 'Benutzer bearbeiten', nav: false },
                { route: 'add', moduleId: 'viewmodels/userEditor', title: 'Benutzer hinzufügen', nav: false }

            ])
            .buildNavigationModel();
    };
    
    return module;

});