
define(['knockout', 'knockout.custom-bindings'], function (ko, model) {
    describe('Knockout Custom Bindings', function () {
        describe('UniqueId Bindings', function () {

            it('registers a custom knockout binding called uniqueId', function () {
                expect(ko.bindingHandlers.uniqueId).toBeDefined();
            });

            it('registers a custom knockout binding called uniqueFor', function () {
                expect(ko.bindingHandlers.uniqueFor).toBeDefined();
            });

            describe('UniqueIdProvider', function () {

                it('returns different ids for different observables when using the same prefix', function () {
                    var provider = new model.UniqueIdProvider();

                    var a = ko.observable();
                    var b = ko.observable();

                    var uniqueIdA = provider.getUniqueId('test', a);
                    var uniqueIdB = provider.getUniqueId('test', b);

                    expect(uniqueIdA).not.toEqual(uniqueIdB);
                });

                it('returns the same id for the same observable when using the same prefix', function () {
                    var provider = new model.UniqueIdProvider();

                    var a = ko.observable();
                    var uniqueId1 = provider.getUniqueId('test', a);
                    var uniqueId2 = provider.getUniqueId('test', a);

                    expect(uniqueId1).toEqual(uniqueId2);
                });

                it('returns different ids for the same observable when using different prefixes', function () {
                    var provider = new model.UniqueIdProvider();

                    var a = ko.observable();
                    var uniqueId1 = provider.getUniqueId('ns1', a);
                    var uniqueId2 = provider.getUniqueId('ns2', a);

                    expect(uniqueId1).not.toEqual(uniqueId2);
                });

                it('extends the observable by adding a Object with the name uniqueIds', function () {
                    var provider = new model.UniqueIdProvider();

                    var a = ko.observable();
                    var uniqueId1 = provider.getUniqueId('test', a);

                    expect(a.uniqueIds).toBeDefined();
                });
            });

            describe('UniqueIdCollection', function () {

                it('returns the same id for the same prefix', function () {
                    var a = ko.observable();
                    var coll = new model.UniqueIdCollection(a);

                    var uniqueId1 = coll.getId('test');
                    var uniqueId2 = coll.getId('test');

                    expect(uniqueId1).toEqual(uniqueId2);
                });

                it('returns different ids for different prefixes', function () {
                    var a = ko.observable();
                    var coll = new model.UniqueIdCollection(a);

                    var uniqueId1 = coll.getId('ns1');
                    var uniqueId2 = coll.getId('ns2');

                    expect(uniqueId1).not.toEqual(uniqueId2);
                });

                it('uses the default prefix if no prefix is provided', function () {
                    var a = ko.observable();
                    var coll = new model.UniqueIdCollection(a);

                    var uniqueId = coll.getId();

                    expect(uniqueId).toMatch(ko.bindingHandlers.uniqueId.prefix);
                });

            });

            describe('UniqueIdNamespace', function () {

                it('returns a new id for every call of nextId', function () {
                    var ns = new model.UniqueIdNamespace('test');

                    var uniqueId1 = ns.nextId();
                    var uniqueId2 = ns.nextId();

                    expect(uniqueId1).not.toEqual(uniqueId2);
                });

            });

        });

        describe('Popover Bindings', function () {

            it('registers a custom knockout binding called popover', function () {
                expect(ko.bindingHandlers.popover).toBeDefined();
            });

        });

        describe('composeEditor Binding', function () {

            it('registers a custom knockout binding called composeEditor', function () {
                expect(ko.bindingHandlers.composeEditor).toBeDefined();
            });

        });
    });
});