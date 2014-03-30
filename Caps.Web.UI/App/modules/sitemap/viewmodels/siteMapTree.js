define([
    'ko',
    'durandal/system',
    'entityManagerProvider',
    'breeze',
    './siteMapViewModel'
],
function (ko, system, entityManagerProvider, breeze, SiteMapViewModel) {

    var EntityQuery = breeze.EntityQuery;

    function SiteMapTree(options) {
        var self = this,
            manager = entityManagerProvider.createManager();

        options = options || {};

        self.manager = manager;
        self.website = ko.observable();
        self.selectedSiteMap = ko.observable();
        self.selectedNode = ko.observable();
        self.siteMapSelectionEnabled = ko.observable(options.canSelectSiteMap !== false);

        self.selectedSiteMap.subscribe(function (newValue) {
            self.selectedNode(null);
            if (newValue) {
                fetchTree(newValue.entity().Id()).then(function () {
                    newValue.buildTree();
                    if (newValue.entity().rootNodes().length)
                        newValue.selectNodeByKey(newValue.entity().rootNodes()[0].Id());
                });
            }

            function fetchTree(siteMapId) {
                var query = new EntityQuery('SiteMapNodes').where('SiteMapId', '==', siteMapId).expand('Resources');
                return self.manager.executeQuery(query);
            }
        });

        self.siteMaps = ko.computed(function () {
            var items = self.website() ? self.website().sortedSiteMapVersions() : [];
            return ko.utils.arrayMap(items, function (siteMap) {
                var smvm = new SiteMapViewModel(siteMap, manager);
                smvm.selectedNodeChanged = function (node) { if (node) self.selectedNode(node.entity()); };
                return smvm;
            });
        });

        self.findSiteMap = function (entity) {
            return ko.utils.arrayFirst(self.siteMaps(), function (smvm) {
                return smvm.entity() === entity;
            });
        };

        self.isNodeEnabled = function (node) {
            if (options.nodeFilter && system.isFunction(options.nodeFilter))
                return options.nodeFilter.call(self, node);
            return true;
        };
    }
    
    SiteMapTree.prototype.fetchSiteMapVersions = function () {
        var self = this,
            query = new EntityQuery().from('Websites').expand('SiteMapVersions');

        return self.manager.executeQuery(query).then(function (data) {
            self.website(data.results[0]);
            self.selectedSiteMap(self.findSiteMap(self.website().latestSiteMap()));
        });
    };

    return SiteMapTree;

});