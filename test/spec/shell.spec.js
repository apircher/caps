define(['viewmodels/shell', 'plugins/router', 'infrastructure/moduleRouter', 'infrastructure/moduleRegistry', 'spec/testModuleA', 'spec/testModuleB', 'authentication', 'Q'],
function (shellViewModel, shellRouter, moduleRouter, moduleRegistry, testModuleA, testModuleB, authentication, Q) {

    describe('shell view model', function () {

        beforeEach(function () {
            shellRouter.reset();
            shellRouter.deactivate();
            moduleRegistry.modules.removeAll();
        });

        it('calls moduleRouter.mapModuleRoutes when activated', function () {
            spyOn(moduleRouter, 'mapModuleRoutes').andCallThrough();
            shellViewModel.activate();
            expect(moduleRouter.mapModuleRoutes).toHaveBeenCalled();
        });

        it('provides a navigationIems collection', function () {
            expect(shellViewModel.navigationItems).toBeDefined();
        });

        describe('navigationItems', function () {
            it('contains only the routes that are accessible for the authenticated user', function () {
                authentication.user(new authentication.UserModel(true, 'John Doe', []));
                moduleRegistry.registerModule(testModuleA);
                moduleRegistry.registerModule(testModuleB);

                moduleRouter.mapModuleRoutes(shellRouter)
                    .buildNavigationModel();
                
                var navigationItems = shellViewModel.navigationItems();
                expect(navigationItems.length).toBe(1);
                expect(navigationItems[0]).toBe(testModuleB.routeConfig);
            });

            it('contains no routes when there is no authenticated user', function () {
                authentication.user(new authentication.UserModel());
                moduleRegistry.registerModule(testModuleA);
                moduleRegistry.registerModule(testModuleB);

                moduleRouter.mapModuleRoutes(shellRouter)
                    .buildNavigationModel();

                var navigationItems = shellViewModel.navigationItems();
                expect(navigationItems.length).toBe(0);
            });
        });
    });

});