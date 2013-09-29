define(['require', 'durandal/app', 'knockout', 'Q', 'infrastructure/datacontext', 'authentication'], function (require, app, ko, Q, datacontext, authentication) {

    var tags = ko.observableArray([]);

    app.on('caps:authentication:loggedOn', function () {
        refreshTags();
    });

    app.on('caps:tag:deleted', function (tag) {
        tags.remove(tag);
    });


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
        if (!authentication.isAuthenticated())
            return;
        return datacontext.getTags()
            .fail(function (err) {
                console.log('Tags could not be refreshed. ' + err.message);
            })
            .done(function (data) {
                if (data && data.results) tags(data.results);
            });
    }

    if (authentication.isAuthenticated())
        refreshTags();

    return {
        tags: tags,
        findTagByName: findTagByName,
        findTagById: findTagById,
        getOrCreateTag: getOrCreateTag,
        refreshTags: refreshTags
    };
});