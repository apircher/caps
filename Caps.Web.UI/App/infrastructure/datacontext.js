define(['breeze', 'entityManagerProvider', 'Q'], function (breeze, provider, Q) {

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
        manager.executeQuery(query).done(lookupSucceeded)
            .fail(deferred.reject);

        function lookupSucceeded(data) {
            if (data.results.length > 0) {
                deferred.resolve(data.results[0]);
            }
            else {
                var newTag = manager.createEntity('Tag', { Name: tagName });
                manager.addEntity(newTag);
                manager.saveChanges();
            }
        }
    }
    
    return {
        getWebsites: getWebsites,
        getTags: getTags
    };

});