define(['infrastructure/moduleFactory', 'knockout'], function (moduleFactory, ko) {

    describe('moduleFactory', function () {

        var testConfig;
        var module;

        beforeEach(function () {
            testConfig = {
                route: 'xyz'
            };
        });

        it('provides a base class for all modules', function () {
            expect(moduleFactory.CapsModule).toBeDefined();
        });

        it('provides a factory method for creating new modules', function () {
            expect(moduleFactory.createModule).toBeDefined();
        });

        describe('CapsModule', function () {
            beforeEach(function () {
                module = new moduleFactory.CapsModule(testConfig);
            });

            it('stores the provided routeConfig in a property called routeConfig', function () {
                expect(module.routeConfig).toBeDefined();
                expect(module.routeConfig).toBe(testConfig);
            });

            it('defines a initializeRouter-Function', function () {
                expect(module.initializeRouter).toBeDefined();
            });
        });

        describe('createModule', function () {
            beforeEach(function () {
                module = moduleFactory.createModule(testConfig);
            });
            it('creates a CapsModule with the given routeConfig', function () {
                expect(module).toBeDefined();
                expect(module.routeConfig).toBeDefined();
                expect(module.routeConfig).toBe(testConfig);
            });
            it('adds a observable property called hasUnsavedChanges with a default value of false to the provided routeConfig', function () {
                expect(module.routeConfig.hasUnsavedChanges).toBeDefined();
                expect(ko.isObservable(module.routeConfig.hasUnsavedChanges)).toBe(true);
                expect(module.routeConfig.hasUnsavedChanges()).toBe(false);
            });
            it('does not override an already existing hasUnsavedChanges-Property on the given routeConfig', function () {
                var obs = ko.observable();
                testConfig = {
                    route: 'xyz',
                    hasUnsavedChanges: obs
                };
                module = moduleFactory.createModule(testConfig);
                expect(module.routeConfig.hasUnsavedChanges).toBe(obs);
            });
        });

    });

});