define([
    'plugins/dialog',
    'ko',
    'entityManagerProvider',
    'breeze',
    './siteMapViewModel',
    'durandal/system'
],
function (dialog, ko, entityManagerProvider, breeze, SiteMapViewModel, system) {

    var EntityQuery = breeze.EntityQuery,
        lastSelectedSiteMapId;

    function SiteMapNodeSelectionDialog(options) {
        var self = this,
            manager = entityManagerProvider.createManager();

        self.manager = manager;
        self.website = ko.observable();
        self.selectedSiteMap = ko.observable();
        self.selectedNode = ko.observable();
        self.okTitle = ko.observable(options.okTitle || 'Weiter');
        self.siteMapSelectionEnabled = ko.observable(options.canSelectSiteMap !== false);

        self.isNodeEnabled = function (node) {
            if (options.nodeFilter && system.isFunction(options.nodeFilter))
                return options.nodeFilter.call(self, node);
            return true;
        };

        options = options || {};

        self.selectedSiteMap.subscribe(function (newValue) {
            self.selectedNode(null);
            if (newValue) {
                lastSelectedSiteMapId = newValue.entity().Id();
                newValue.fetchTree().then(function () {
                    if (newValue.entity().rootNodes().length)
                        newValue.selectNodeByKey(newValue.entity().rootNodes()[0].Id());
                });
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
    }

    SiteMapNodeSelectionDialog.prototype.activate = function () {
        this.fetchSiteMapVersions();
    };

    SiteMapNodeSelectionDialog.prototype.fetchSiteMapVersions = function () {
        var self = this,
            query = new EntityQuery().from('Websites').expand('SiteMapVersions');

        return self.manager.executeQuery(query).then(function (data) {
            self.website(data.results[0]);

            var siteMap;
            if (lastSelectedSiteMapId) 
                siteMap = ko.utils.arrayFirst(self.website().SiteMapVersions(), function(smv) { return smv.Id() === lastSelectedSiteMapId; }); 
            self.selectedSiteMap(self.findSiteMap(siteMap || self.website().latestSitemap()));
        });
    };
        
    SiteMapNodeSelectionDialog.prototype.selectOk = function () {
        if (!this.selectedNode()) {
            //Todo: Show message...
            return;
        }

        dialog.close(this, {
            dialogResult: true,
            selectedNode: this.selectedNode()
        });
    };

    SiteMapNodeSelectionDialog.prototype.selectCancel = function () {
        dialog.close(this, {
            dialogResult: false
        });
    };

    SiteMapNodeSelectionDialog.install = function () {
        require(['plugins/siteMapNodeSelection'], function (siteMapNodeSelection) {
            siteMapNodeSelection.registerDialog(SiteMapNodeSelectionDialog);
        });
    };

    return SiteMapNodeSelectionDialog;
});