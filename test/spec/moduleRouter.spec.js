define(['infrastructure/moduleRouter', 'spec/testModuleA', 'infrastructure/moduleRegistry', 'plugins/router'], function (moduleRouter, testModule, moduleRegistry, shellRouter) {
        
    describe('moduleRouter', function () {
        
        it('provides a factory to create module routers', function () {
            expect(moduleRouter.createModuleRouter).toBeDefined();
            expect(typeof moduleRouter.createModuleRouter).toEqual('function');
        });

        it('provides a function to map the routes of all registered modules to the root router', function () {
            expect(moduleRouter.mapModuleRoutes).toBeDefined();
        });

        describe('createModuleRouter', function () {

            it('creates a child router for the given module', function () {
                var childRouter = moduleRouter.createModuleRouter(testModule, 'test/', 'test');
                expect(childRouter).not.toBeNull();
            });

            describe('child router', function () {

                it('adds a navigateToModule function to the child router', function () {
                    var childRouter = moduleRouter.createModuleRouter(testModule, 'test/', 'test');
                    expect(childRouter.navigateToModule).toBeDefined();
                });

                describe('areSameItem Override', function () {
                    it('returns false when called with different items', function () {
                        var childRouter = moduleRouter.createModuleRouter(testModule, 'test/', 'test');
                        var vmA = { id: 1 };
                        var vmB = { id: 2 };
                        var result = childRouter.activeItem.settings.areSameItem(vmA, vmB, [1], [2]);
                        expect(result).toBe(false);
                    });

                    it('when called with equal items, calls module.shouldActivate when defined', function () {
                        var childRouter = moduleRouter.createModuleRouter(testModule, 'test/', 'test');
                        var vm = {
                            id: 1,
                            shouldActivate: function () { return true; }
                        };
                        spyOn(vm, 'shouldActivate');
                        var result = childRouter.activeItem.settings.areSameItem(vm, vm, [1], [2]);
                        expect(vm.shouldActivate).toHaveBeenCalled();
                    });

                    it('when called with equal items, compares the activation data when module.shouldActivate is not defined', function () {
                        var childRouter = moduleRouter.createModuleRouter(testModule, 'test/', 'test');
                        var vm = {
                            id: 1
                        };
                        var result1 = childRouter.activeItem.settings.areSameItem(vm, vm, [1, 2], [1, 3]);
                        var result2 = childRouter.activeItem.settings.areSameItem(vm, vm, [1, 2], [1, 2]);
                        expect(result1).toBe(false);
                        expect(result2).toBe(true);
                    });

                    it('returns false when module.shouldActivate returns true', function () {
                        var childRouter = moduleRouter.createModuleRouter(testModule, 'test/', 'test');
                        var vm = {
                            id: 1,
                            shouldActivate: function () { return true; }
                        };
                        var result = childRouter.activeItem.settings.areSameItem(vm, vm, [1], [2]);
                        expect(result).toBe(false);
                    });
                });

            });
            
        });

        describe('mapModuleRoutes', function () {

            beforeEach(function () {
                moduleRegistry.modules.removeAll();
                shellRouter.reset();
            });
            
            it('throws an Error if any modules without routeConfig are registered', function () {
                moduleRegistry.registerModule({ something: 1 });
                expect(function () {
                    moduleRouter.mapModuleRoutes(shellRouter);
                })
                .toThrow(new Error('No moduleRoute found.'));
            });

            it('adds a isModuleRoute-Property with the value true to the routeConfig of all registered modules', function () {
                var module = {
                    routeConfig: {
                        route: 'test*details',
                        moduleId: 'test/module',
                        title: 'Test-Modul',
                        nav: 10,
                        hash: '#test',
                    }
                };
                moduleRegistry.registerModule(module);
                moduleRouter.mapModuleRoutes(shellRouter);
                expect(module.routeConfig.isModuleRoute).toBeDefined();
                expect(module.routeConfig.isModuleRoute).toBe(true);
            });

            it('calls module.initializeRouter for all registered modules', function() {
                var module = {
                    routeConfig: {
                        route: 'test*details',
                        moduleId: 'test/module',
                        title: 'Test-Modul',
                        nav: 10,
                        hash: '#test',
                    },
                    initializeRouter: function () { }
                };
                moduleRegistry.registerModule(module);
                spyOn(module, 'initializeRouter');
                moduleRouter.mapModuleRoutes(shellRouter);
                expect(module.initializeRouter).toHaveBeenCalled();
            });

            it('calls the map-function of the shell router with the routeConfig of all registered modules', function () {
                var module = {
                    routeConfig: {
                        route: 'test*details',
                        moduleId: 'test/module',
                        title: 'Test-Modul',
                        nav: 10,
                        hash: '#test',
                    },
                    initializeRouter: function () { }
                };
                moduleRegistry.registerModule(module);
                spyOn(shellRouter, 'map');
                moduleRouter.mapModuleRoutes(shellRouter);
                expect(shellRouter.map).toHaveBeenCalledWith(module.routeConfig);
            });

        });

    });

});