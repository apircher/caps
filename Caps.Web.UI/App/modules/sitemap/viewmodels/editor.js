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
                name: 'ROOT',
                isRoot: true
            },
            {
                title: 'Aufmacher',
                name: 'TEASER'
            },
            {
                title: 'Benutzerdefiniert',
                isCustomType: true,
                name: ''
            }
        ];

    function SitemapNodeEditor() {
        var self = this,
            manager;

        self.entity = ko.observable();
        self.nodeTypes = nodeTypes;
        self.nodeType = ko.observable();

        self.nodeType.subscribe(function (newValue) {
            if (newValue) {
                if (newValue.name)
                    self.entity().NodeType(newValue.name);
            }
        });

        self.activate = function (sitemapNodeId) {
            manager = entityManagerProvider.createManager();
            fetchNode(sitemapNodeId).then(function (data) {
                self.entity(data.results[0]);
                self.nodeType(findNodeType(data.results[0].NodeType()));
            });
        };

        self.navigateBack = function () {
            module.router.navigate(module.routeConfig.hash);
        };

        self.saveChanges = function () {
            manager.saveChanges().then(function () {
                app.trigger('caps:sitemapnode:saved', self.entity());
                self.navigateBack();
            });
        };

        function fetchNode(id) {
            var query = new EntityQuery().from('SiteMapNodes').where('Id', '==', id).expand('Resources');
            return manager.executeQuery(query);
        }

        function findNodeType(nodeType) {
            if (!nodeType || !nodeType.length)
                return findCustomType();
            var hit = ko.utils.arrayFirst(nodeTypes, function (nt) { return nt.name && nt.name.toLowerCase() === self.entity().NodeType().toLowerCase(); });
            return hit || findCustomType();
        }

        function findCustomType() {
            return ko.utils.arrayFirst(nodeTypes, function (nt) { return nt.isCustomType; });
        }
    }

    return SitemapNodeEditor;
});