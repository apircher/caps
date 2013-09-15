define(['breeze', 'entityManagerProvider', 'Q', 'durandal/app'], function (breeze, provider, Q, app) {

    var manager = provider.createManager();
    var EntityQuery = breeze.EntityQuery;

    function getWebsites() {
        var query = new EntityQuery().from('Websites');
        return manager.executeQuery(query);
    }

    function getTags() {
        var query = EntityQuery.from('Tags');
        return manager.executeQuery(query);
    }

    function getOrCreateTag(tagName) {
        var deferred = Q.defer();
        var query = new EntityQuery()
            .from('Tags')
            .where('Name', '==', tagName);
        manager.executeQuery(query).then(lookupSucceeded).fail(deferred.reject);

        function lookupSucceeded(data) {
            if (data.results.length > 0) {
                deferred.resolve(data.results[0]);
            }
            else {
                var newTag = manager.createEntity('Tag', { Name: tagName });
                manager.addEntity(newTag);
                manager.saveChanges().done(function () {
                    app.trigger('caps:tags:added', newTag);
                    deferred.resolve(newTag);
                });
            }
        }

        return deferred.promise;
    }
    
    return {
        getWebsites: getWebsites,
        getTags: getTags,
        getOrCreateTag: getOrCreateTag
    };

});