define([
    'ko',
    'moment',
    'breeze',
    'durandal/system',
    'infrastructure/treeViewModel',
    '../datacontext'
],
function (ko, moment, breeze, system, TreeModel, datacontext) {
    
    var EntityQuery = breeze.EntityQuery;

    /*
     * SiteMapViewModel class
     */
    function SiteMapViewModel(siteMap) {
        var self = this;

        self.entity = ko.observable(siteMap);
        self.tree = ko.observable();

        self.publishedFromNow = ko.computed(function () {
            return moment.utc(self.entity().PublishedFrom()).fromNow();
        });

        self.title = ko.computed(function () {
            return 'Version ' + self.entity().Version();
        });
    }

    SiteMapViewModel.prototype.fetchTree = function () {
        var self = this;
        return system.defer(function (dfd) {
            datacontext.fetchSiteMapNodes(self.entity().Id()).then(function (data) {
                self.buildTree();
                dfd.resolve();
            })
            .fail(dfd.reject);
        })
        .promise();
    };

    SiteMapViewModel.prototype.buildTree = function () {
        var self = this,
            siteMap = self.entity(),
            tree = new TreeModel.TreeViewModel();

        tree.keyName('Id');
        appendTreeNodes(tree.root, siteMap.rootNodes());
        tree.expandRootNodes();

        tree.selectedNode.subscribe(function () {
            self.selectedNodeChanged.call(self, tree.selectedNode());
        });

        function appendTreeNodes(parentNode, siteMapNodes) {
            ko.utils.arrayForEach(siteMapNodes, function (siteMapNode) {
                var node = tree.createNode();
                node.entity(siteMapNode);
                parentNode.addChildNode(node);
                appendTreeNodes(node, siteMapNode.childNodes());
            });
        }

        self.tree(tree);
    };

    SiteMapViewModel.prototype.selectedNodeChanged = function (node) {
    };

    SiteMapViewModel.prototype.refreshTree = function () {
        var siteMap = this.entity(),
            state = [];

        if (this.tree())
            state = this.tree().saveState();

        this.buildTree(siteMap);

        if (this.tree() && state)
            this.tree().restoreState(state);
    };

    SiteMapViewModel.prototype.selectNodeByKey = function (key) {
        if (this.tree()) this.tree().selectNodeByKey(key);
    };

    SiteMapViewModel.prototype.selectRootNode = function () {
        if (this.tree()) {
            var rootNodes = this.tree().rootNodes();
            var root = rootNodes.length ? rootNodes[0] : undefined;
            if (root) this.tree().selectedNode(root);
        }
    };

    SiteMapViewModel.prototype.containsNode = function (node) {
        return node && this.entity().containsNode(node);
    };

    return SiteMapViewModel;
});