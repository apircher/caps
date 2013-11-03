/*
 * infrastructure/datacontext.js
 * Provides functions to retrieve entities that could be used in every module.
 */
define([
    'breeze',
    'entityManagerProvider',
    'durandal/system',
    'durandal/app'
],
function (breeze, provider, system, app) {

    var manager = provider.createManager(),
        EntityQuery = breeze.EntityQuery;

    /*
     * Fetch all Website-Entities.
     */
    function getWebsites() {
        var query = new EntityQuery().from('Websites');
        return manager.executeQuery(query);
    }

    /*
     * Fetch all Tag-Entities.
     */
    function getTags() {
        var query = EntityQuery.from('Tags');
        return manager.executeQuery(query);
    }

    /*
     * Tries to fetch a Tag-Entity with the given name.
     * Returns a new entity if no match was found.
     */
    function getOrCreateTag(tagName) {
        return system.defer(function (dfd) {
            var query = new EntityQuery()
                .from('Tags')
                .where('Name', '==', tagName);
            manager.executeQuery(query).then(lookupSucceeded).fail(dfd.reject);

            function lookupSucceeded(data) {
                if (data.results.length > 0) {
                    dfd.resolve(data.results[0]);
                }
                else {
                    var newTag = manager.createEntity('Tag', { Name: tagName });
                    manager.addEntity(newTag);
                    manager.saveChanges().done(function () {
                        app.trigger('caps:tags:added', newTag);
                        dfd.resolve(newTag);
                    });
                }
            }
        })
        .promise();
    }
    
    return {
        getWebsites: getWebsites,
        getTags: getTags,
        getOrCreateTag: getOrCreateTag
    };

});