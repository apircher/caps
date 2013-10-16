define(['entityManagerProvider'], function (entityManagerProvider) {
    
    var manager = entityManagerProvider.createManager();
    var EntityQuery = breeze.EntityQuery;

    function getDrafts() {
        var query = EntityQuery.from('Drafts');
        return manager.executeQuery(query);
    }

    return {
        getDrafts: getDrafts
    };
});