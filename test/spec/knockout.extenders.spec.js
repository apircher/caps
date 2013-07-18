define(['knockout.extenders', 'knockout'], function (extenders, ko) {

    describe('knockout.extenders', function () {

        it('defines a knockout extender called trackDirtyWithInitialStateOf', function () {
            expect(ko.extenders.trackDirtyWithInitialStateOf).toBeDefined();
        });

        describe('trackDirtyWithInitialStateOf', function () {
            it('adds a isDirty-Function to a given observable', function () {
                var obs = ko.observable().extend({ trackDirtyWithInitialStateOf: false });
                expect(obs.isDirty).toBeDefined();
            });
            it('adds a markClean-Function to a given observable', function () {
                var obs = ko.observable().extend({ trackDirtyWithInitialStateOf: false });
                expect(obs.markClean).toBeDefined();
            });
            it('adds a markDirty-Function to a given observable', function () {
                var obs = ko.observable().extend({ trackDirtyWithInitialStateOf: false });
                expect(obs.markDirty).toBeDefined();
            });

            describe('isDirty-Function', function () {
                it('returns true when the initial state was true', function () {
                    var obs = ko.observable().extend({ trackDirtyWithInitialStateOf: true });
                    expect(obs.isDirty()).toBe(true);
                });
                it('returns false when the initial state was false', function () {
                    var obs = ko.observable().extend({ trackDirtyWithInitialStateOf: false });
                    expect(obs.isDirty()).toBe(false);
                });
                it('returns true after the observable has been changed', function () {
                    var obs = ko.observable(false).extend({ trackDirtyWithInitialStateOf: false });
                    obs(true);
                    expect(obs.isDirty()).toBe(true);
                });
                it('returns true after a nested observable property ob the observable has been changed', function () {
                    var vm = {
                        test1: ko.observable({ test2: ko.observable(2) })
                    };
                    var obs = ko.observable(vm).extend({ trackDirtyWithInitialStateOf: false });
                    var dirty1 = obs.isDirty();
                    obs().test1().test2(3);
                    var dirty2 = obs.isDirty();
                    expect(dirty1).toBe(false);
                    expect(dirty2).toBe(true);
                });
                it('returns false after markClean has been called', function () {
                    var obs = ko.observable().extend({ trackDirtyWithInitialStateOf: true });
                    obs.markClean();
                    expect(obs.isDirty()).toBe(false);
                });
                it('returns true after markDirty has been called', function () {
                    var obs = ko.observable().extend({ trackDirtyWithInitialStateOf: false });
                    obs.markDirty();
                    expect(obs.isDirty()).toBe(true);
                });
            });
        });

    });

});