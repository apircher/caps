define([
    '../module',
    'ko',
    'localization',
    'entityManagerProvider',
    'breeze'
],
function (module, ko, localization, entityManagerProvider, breeze) {

    var EntityQuery = breeze.EntityQuery;

    function SitemapNodeTranslator() {
        var self = this,
            manager = entityManagerProvider.createManager();

        self.language = ko.observable();
        self.entity = ko.observable();
        self.original = ko.observable();
        self.translation = ko.observable();

        self.activate = function (sitemapNodeId, language) {
            self.language(new localization.Language(language));
            fetchNode(sitemapNodeId).then(function (data) {
                if (data.results.length) {
                    var n = data.results[0];
                    self.entity(n);
                    self.original(n.getOrCreateResource('de', manager));
                    self.translation(n.getOrCreateResource(language, manager));
                }
            });
        };

        self.navigateBack = function () {
            self.showDraftsIndex();
        };

        self.showDraftsIndex = function () {
            module.router.navigate(module.routeConfig.hash);
        };

        self.saveChanges = function () {
            manager.saveChanges().then(self.showDraftsIndex);
        };

        function fetchNode(id) {
            var query = new EntityQuery().from('SitemapNodes').where('Id', '==', id).expand('Resources');
            return manager.executeQuery(query);
        }
    }

    return SitemapNodeTranslator;
});