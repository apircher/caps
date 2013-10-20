define(['infrastructure/moduleHistory', 'durandal/system', 'spec/testModuleA'], function (ModuleHistory, system, testModule) {

    describe('moduleHistory', function () {
        var moduleHistory,
            testActivation = { route: 'xyz', hash: '#xyz' },
            testInstruction = { fragment: 'xyz' },
            testActivation2 = { route: 'abc', hash: '#abc' },
            testInstruction2 = { fragment: 'abc' };

        beforeEach(function () {
            moduleHistory = new ModuleHistory(testModule, { navigate: function () { } });
        });

        it('is a constructor function for creating ModuleHistory instances', function () {
            expect(ModuleHistory).toBeDefined();
            expect(system.isFunction(ModuleHistory)).toBe(true);
        });

        describe('moduleHistory.registerActivation', function () {
            it('stores activations in the activations-array of the moduleHistory', function () {                
                moduleHistory.registerActivation(testActivation, testInstruction);
                expect(moduleHistory.activations.length).toBe(1);
                expect(moduleHistory.activations[0].activation).toBe(testActivation);
                expect(moduleHistory.activations[0].instruction).toBe(testInstruction);
            });
        });

        describe('moduleHistory.activateLast', function () {
            it('navigates to the module route when no activations are present', function () {
                spyOn(moduleHistory.router, 'navigate');
                moduleHistory.activateLast();
                expect(moduleHistory.router.navigate).toHaveBeenCalledWith(testModule.routeConfig.hash);
            });
            it('navigates to the last activation when one is present', function () {
                moduleHistory.registerActivation(testActivation, testInstruction);
                spyOn(moduleHistory.router, 'navigate');
                moduleHistory.activateLast();
                expect(moduleHistory.router.navigate).toHaveBeenCalledWith('#xyz');
            });
            it('does not remove the last activation', function () {
                moduleHistory.registerActivation(testActivation, testInstruction);
                spyOn(moduleHistory.router, 'navigate');
                moduleHistory.activateLast();
                expect(moduleHistory.activations.length).toBe(1);
                expect(moduleHistory.activations[0].activation).toBe(testActivation);
                expect(moduleHistory.activations[0].instruction).toBe(testInstruction);
            });
        });

        describe('moduleHistory.navigateBack', function () {
            it('navigates to the activation that occured before the current one', function () {
                moduleHistory.registerActivation(testActivation, testInstruction);
                moduleHistory.registerActivation(testActivation2, testInstruction2);
                spyOn(moduleHistory.router, 'navigate');
                moduleHistory.navigateBack();
                expect(moduleHistory.router.navigate).toHaveBeenCalledWith('#xyz');
            });
        });
    });

});