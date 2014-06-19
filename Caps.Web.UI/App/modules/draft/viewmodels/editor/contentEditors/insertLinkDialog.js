define([
    'plugins/dialog',
    'ko',
    'modules/sitemap/viewmodels/siteMapTree',
],
function (dialog, ko, SiteMapTree) {

    function InsertLinkDialog() {
        var self = this;

        self.siteMapTree = new SiteMapTree();
        self.url = ko.observable('http://www.google.com').extend({ required: true });

        self.ok = function () {
            dialog.close(self, {
                result: true,
                url: self.url()
            });
        };

        self.cancel = function () {
            dialog.close(self, {
                result: false
            });
        };

        ko.validation.group(self);

        self.siteMapTree.fetchSiteMapVersions().then(function() {
            
        });

        self.siteMapTree.selectedNode.subscribe(function () {
            var n = self.siteMapTree.selectedNode();
            if (n) {
                self.url(formatCapsContentLink(n.PermanentId()));
            }
        });

        function formatCapsContentLink(permanentId) {
            return 'caps://publication/' + permanentId;
        }
    }

    return InsertLinkDialog;

});