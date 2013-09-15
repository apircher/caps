define(['require', 'knockout', 'Q', 'infrastructure/datacontext'], function (require, ko, Q, datacontext) {

    var tags = ko.observableArray([]);

    function findTagByName(tagName) {
        var k = tagName.toLowerCase();
        return ko.utils.arrayFirst(tags(), function (item) {
            return item.Name().toLowerCase() === k;
        });
    }

    function findTagById(tagId) {
        return ko.utils.arrayFirst(tags(), function (item) {
            return item.Id() === tagId;
        });
    }

    function getOrCreateTag(tagName) {
        var deferred = Q.defer();
        var t = findTagByName(tagName);
        if (t) {
            deferred.resolve(t);
        }
        else {
            datacontext.getOrCreateTag(tagName)
                .fail(deferred.reject)
                .done(function (data) {
                    tags.push(data);
                    deferred.resolve(data);
                });
        }
        return deferred.promise;
    }

    function refreshTags() {
        return datacontext.getTags()
            .done(function (data) {
                tags(data.results);
            });
    }

    return {
        tags: tags,
        findTagByName: findTagByName,
        findTagById: findTagById,
        getOrCreateTag: getOrCreateTag,
        refreshTags: refreshTags
    };
});