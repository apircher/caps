define(['infrastructure/moduleRegistry', 'knockout', 'spec/testModuleA'], function (moduleRegistry, ko, testModule) {

    describe('moduleRegistry', function () {
        it('provides a function called registerModule to register modules', function () {
            expect(moduleRegistry.registerModule).toBeDefined();
        });

        it('provides an observable array containing the registered modules', function () {
            expect(moduleRegistry.modules).toBeDefined();
            expect(ko.isObservable(moduleRegistry.modules)).toBe(true);
        });

        it('adds registered modules to the modules array', function () {
            moduleRegistry.modules.removeAll();
            moduleRegistry.registerModule(testModule);
            expect(moduleRegistry.modules()[0]).toBe(testModule);
        });
    });

});