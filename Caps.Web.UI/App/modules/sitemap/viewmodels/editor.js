define([
    '../module',
    'ko',
    'entityManagerProvider',
    'breeze',
    'durandal/app',
    'localization'
],
function (module, ko, entityManagerProvider, breeze, app, localization) {

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
                title: 'Container',
                name: 'CONTAINER'
            },
            {
                title: 'Benutzerdefiniert',
                isCustomType: true,
                name: ''
            }
        ];

    function SiteMapNodeEditor() {
        var self = this,
            manager;

        self.entity = ko.observable();
        self.nodeTypes = nodeTypes;
        self.nodeType = ko.observable();
        self.supportedTranslations = localization.website.supportedTranslations();

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

        self.editTranslation = function (language) {
            if (self.entity()) module.router.navigate('#sitemap/translate/' + self.entity().Id() + '/' + language.culture);
        };

        self.choosePicture = function () {
            app.selectFiles({
                module: module,
                title: 'Abbildung wählen'
            }).then(function (result) {
                if (result.dialogResult) {
                    var file = result.selectedFiles[0];
                    var version = file.latestVersion();
                    self.entity().getResource('de').PictureFileVersionId(version.Id());
                }
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

    return SiteMapNodeEditor;
});