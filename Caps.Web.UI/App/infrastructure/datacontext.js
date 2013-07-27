define(['breeze', 'entityManagerProvider'], function (breeze, provider) {

    var manager = provider.createManager();

    function getWebsites() {
        var query = new breeze.EntityQuery().from('Websites');
        return manager.executeQuery(query);
    }
    
    return {
        getWebsites: getWebsites
    };

});