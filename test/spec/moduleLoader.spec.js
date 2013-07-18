define(['infrastructure/moduleLoader', 'infrastructure/moduleRegistry', 'Q'], function (moduleLoader, moduleRegistry, Q) {

    describe('moduleLoader', function () {

        it('provides a function called loadModule to load a single module', function () {
            expect(moduleLoader.loadModule).toBeDefined();
        });

        it('provides a function called loadModules to load multiple modules', function () {
            expect(moduleLoader.loadModules).toBeDefined();
        });

        describe('loadModule', function () {

            it('loads the module with the given name and adds it to the moduleRegistry', function () {

                moduleRegistry.modules.removeAll();
                var flag = false;

                runs(function () {
                    Q.when(moduleLoader.loadModule('testA')).then(function () {
                        flag = true;
                    });
                });

                waitsFor(function () {
                    return flag;
                }, 'a timeout occured while loading the module', 500);

                runs(function () {
                    expect(moduleRegistry.modules().length).toBe(1);
                });

            });

            it('throws an error if called with an argument that is not a string', function () {
                expect(function () {
                    moduleLoader.loadModule({});
                })
                .toThrow(new Error('The parameter name has to be a string.'));
            });

        });

        describe('loadModules', function () {

            it('loads the modules with the given names and adds them to the moduleRegistry', function () {

                moduleRegistry.modules.removeAll();
                var flag = false;

                runs(function () {
                    Q.when(moduleLoader.loadModules(['testA', 'testB'])).then(function () {
                        flag = true;
                    });
                });

                waitsFor(function () {
                    return flag;
                }, 'a timeout occured while loading the modules', 500);

                runs(function () {
                    expect(moduleRegistry.modules().length).toBe(2);
                });

            });

        });

    });

});