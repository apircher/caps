define([
    'plugins/dialog',
    'ko',
    'entityManagerProvider',
    'breeze'
],
function (dialog, ko, entityManagerProvider, breeze) {

    var EntityQuery = breeze.EntityQuery;

    function SitemapNodeSelectionDialog(options) {
        var self = this,
            manager = entityManagerProvider.createManager();

        self._manager = manager;
        self.website = ko.observable();
        self.sitemaps = ko.observableArray();
        self.selectedSitemap = ko.observable();
        self.selectedNode = ko.observable();

        options = options || {};

        self.selectedSitemap.subscribe(function () {
            self.selectedNode(null);
            self.fetchNodes();
        });

        self.selectNode = function (node) {
            self.selectedNode(node);
        };
    }

    SitemapNodeSelectionDialog.prototype.activate = function () {
        this.fetchSitemaps();
    };

    SitemapNodeSelectionDialog.prototype.fetchSitemaps = function() {
        var self = this,
            manager = self._manager,
            query = new EntityQuery().from('Websites').expand('Sitemaps');

        return manager.executeQuery(query).then(function (data) {
            self.website(data.results[0]);
            self.sitemaps(self.website().Sitemaps());
            self.selectedSitemap(self.website().latestSitemap());
        });
    };

    SitemapNodeSelectionDialog.prototype.fetchNodes = function () {
        var self = this,
            manager = self._manager,
            query = new EntityQuery().from('SitemapNodes').where('SitemapId', '==', self.selectedSitemap().Id())
                .expand('Resources, ChildNodes, ChildNodes.Resources');

        return manager.executeQuery(query).fail(function(error) {
            alert(error.message);
        });
    };
    
    SitemapNodeSelectionDialog.prototype.selectOk = function () {
        if (!this.selectedNode()) {
            //Todo: Show message...
            return;
        }

        dialog.close(this, {
            dialogResult: true,
            selectedSitemapNode: this.selectedNode()
        });
    };

    SitemapNodeSelectionDialog.prototype.selectCancel = function () {
        dialog.close(this, {
            dialogResult: false
        });
    };

    SitemapNodeSelectionDialog.install = function () {
        require(['plugins/sitemapNodeSelection'], function (sitemapNodeSelection) {
            sitemapNodeSelection.registerDialog(SitemapNodeSelectionDialog);
        });
    };

    return SitemapNodeSelectionDialog;
});