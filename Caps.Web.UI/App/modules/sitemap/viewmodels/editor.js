define([
    '../module',
    'ko',
    'entityManagerProvider',
    'breeze',
    'durandal/app'
],
function (module, ko, entityManagerProvider, breeze, app) {

    var EntityQuery = breeze.EntityQuery;

    function SitemapNodeEditor() {
        var self = this,
            manager = entityManagerProvider.createManager();

        self.entity = ko.observable();

        self.activate = function (sitemapNodeId) {
            fetchNode(sitemapNodeId).then(function (data) {
                self.entity(data.results[0]);
            });
        };

        self.navigateBack = function () {
            self.showDraftsIndex();
        };

        self.showDraftsIndex = function () {
            module.router.navigate(module.routeConfig.hash);
        };

        self.saveChanges = function () {
            manager.saveChanges().then(function () {
                app.trigger('caps:sitemapnode:saved', self.entity());
                self.showDraftsIndex();
            });
        };

        function fetchNode(id) {
            var query = new EntityQuery().from('SitemapNodes').where('Id', '==', id).expand('Resources');
            return manager.executeQuery(query);
        }
    }

    return SitemapNodeEditor;
});