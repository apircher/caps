define([
    '../module',
    'ko',
    'entityManagerProvider',
    'breeze',
    'durandal/app'
],
function (module, ko, entityManagerProvider, breeze, app) {

    var EntityQuery = breeze.EntityQuery,
        nodeTypes = [
            {
                title: 'Inhalts-Seite',
                name: 'PAGE'
            },
            {
                title: 'Statische Seite',
                name: 'ACTION'
            },
            {
                title: 'Startseite',
                name: 'ROOT'
            },
            {
                title: 'Aufmacher',
                name: 'TEASER'
            }
        ];

    function SitemapNodeEditor() {
        var self = this,
            manager = entityManagerProvider.createManager();

        self.entity = ko.observable();
        self.nodeTypes = nodeTypes;
        self.nodeType = ko.computed({
            read: function () {
                if (!self.entity() || !self.entity().NodeType()) return null;
                return ko.utils.arrayFirst(nodeTypes, function (nt) { return nt.name.toLowerCase() === self.entity().NodeType().toLowerCase(); });
            },
            write: function (newValue) {
                if (!self.entity()) return;
                if (newValue) {
                    self.entity().NodeType(newValue.name);
                }
                else {
                    self.entity().NodeType(null);
                }
            },
            owner: self
        });

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
            var query = new EntityQuery().from('SiteMapNodes').where('Id', '==', id).expand('Resources');
            return manager.executeQuery(query);
        }
    }

    return SitemapNodeEditor;
});