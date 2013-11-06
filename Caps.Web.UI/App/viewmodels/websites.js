define([
    'durandal/system',
    'infrastructure/datacontext',
    'entityManagerProvider',
    'ko',
    'breeze',
    'plugins/router'
],
function (system, datacontext, entityManagerProvider, ko, breeze, router) {

    var website = ko.observable(),
        EntityQuery = breeze.EntityQuery,
        manager = entityManagerProvider.createManager();

    function createDefaultWebsite() {
        return system.defer(function (dfd) {
            var entity = manager.createEntity('Website', { Name: 'My Caps Website', Url: 'http://caps.luxbox.net' });
            manager.saveChanges().then(success).fail(dfd.reject);

            function success() {
                dfd.resolve(entity);
            }
        })
        .promise();
    }

    function fetchWebsites() {
        var query = new EntityQuery().from("Websites");
        return manager.executeQuery(query);
    }

    return {
        website: website,

        activate: function () {
            fetchWebsites().then(function (data) {
                if (data.results.length > 0) 
                    website(data.results[0]);
                else {
                    createDefaultWebsite().then(function (entity) {
                        website(entity);
                    });
                }
            });
        },

        saveChanges: function () {
            manager.saveChanges();
        },

        navigateBack: function () {
            router.navigateBack();
        }
    };
});