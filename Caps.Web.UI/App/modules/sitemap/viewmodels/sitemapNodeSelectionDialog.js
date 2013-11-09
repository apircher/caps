define([
    'plugins/dialog',
    'ko',
    'entityManagerProvider',
    'breeze'
],
function (dialog, ko, entityManagerProvider, breeze) {

    var EntityQuery = breeze.EntityQuery;

    function SiteMapNodeSelectionDialog(options) {
        var self = this,
            manager = entityManagerProvider.createManager();

        self.manager = manager;
        self.website = ko.observable();
        self.selectedSiteMapVersion = ko.observable();
        self.selectedNode = ko.observable();

        options = options || {};

        self.selectedSiteMapVersion.subscribe(function () {
            self.selectedNode(null);
            self.fetchNodes();
        });

        self.selectNode = function (node) {
            self.selectedNode(node);
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
            self.selectedSiteMapVersion(self.website().latestSitemap());
        });
    };

    SiteMapNodeSelectionDialog.prototype.fetchNodes = function () {
        var query = new EntityQuery().from('SiteMapNodes').where('SiteMapId', '==', this.selectedSiteMapVersion().Id())
                .expand('Resources, ChildNodes, ChildNodes.Resources');
        return this.manager.executeQuery(query).fail(function(error) {
            alert(error.message);
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