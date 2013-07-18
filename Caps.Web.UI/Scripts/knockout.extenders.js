define(['knockout'], function (ko) {

    /**
     *  Knockout trackDirty extender
     *  Based on http://schinckel.net/2012/01/14/knockoutjs-dirty-extender./
     */
    ko.extenders.trackDirtyWithInitialStateOf = function (target, initialDirtyState) {
        var hashFunction = ko.toJSON;
        if (ko.mapping) hashFunction = ko.mapping.toJSON;

        var cleanValue = ko.observable(hashFunction(target));
        var dirtyOverride = ko.observable(ko.utils.unwrapObservable(initialDirtyState));

        target.isDirty = ko.computed(function () {
            return dirtyOverride() || hashFunction(target) !== cleanValue();
        });

        target.markClean = function () {
            cleanValue(hashFunction(target));
            dirtyOverride(false);
        };

        target.markDirty = function () {
            dirtyOverride(true);
        };

        return target;
    };

    return {
    };
});