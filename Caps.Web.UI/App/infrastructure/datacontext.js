define(function (require) {

    var breeze = require('breeze');
    var provider = require('entityManagerProvider');
    var manager = provider.createManager();

    function getWebsites() {
        var query = new breeze.EntityQuery().from('Websites');
        return manager.executeQuery(query);
    }

    return {
        getWebsites: getWebsites
    };

});