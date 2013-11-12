define(['ko'], function (ko) {

    /*
     * TreeViewModel class
     */
    function TreeViewModel() {
        var self = this;
        self.keyName = ko.observable();
        self.selectedNode = ko.observable();
        self.root = new TreeNodeViewModel(self);
        self.root.isExpanded(true);
        self.rootNodes = ko.computed(function () {
            return self.root.childNodes();
        });
        self.selectedKey = ko.computed(function () {
            return self.selectedNode() ? self.selectedNode().key() : undefined;
        });
    }

    TreeViewModel.prototype.createNode = function () {
        return new TreeNodeViewModel(this);
    };

    TreeViewModel.prototype.saveState = function () {
        var nodeState = [];
        ko.utils.arrayForEach(this.rootNodes(), function (n) { n.saveState(nodeState); });
        return {
            selectedKey: this.selectedKey(),
            nodeState: nodeState
        };
    };

    TreeViewModel.prototype.restoreState = function (state) {
        var self = this;
        ko.utils.arrayForEach(state.nodeState, function (s) {
            var n = self.findNodeByKey(s.key);
            if (n) n.restoreState(s);
        });
        if (state.selectedKey) {
            var n = self.findNodeByKey(state.selectedKey);
            self.selectedNode(n);
        }
    };

    TreeViewModel.prototype.findNodeByKey = function (key) {

        return walkTree(this.rootNodes());

        function walkTree(nodes) {
            if (nodes && nodes.length) {
                for (var i = 0; i < nodes.length; i++) {
                    var n = nodes[i];
                    if (n.key() === key) return n;
                    var x = walkTree(n.childNodes());
                    if (x) return x;
                }
            }
            return undefined;
        }
    };

    TreeViewModel.prototype.selectNodeByKey = function (key) {
        var node = this.findNodeByKey(key);
        if (node) {
            node.selectNode();
            return true;
        }
        return false;
    };

    TreeViewModel.prototype.expandRootNodes = function () {
        ko.utils.arrayForEach(this.rootNodes(), function (node) {
            node.isExpanded(true);
        });
    };

    /*
     * TreeNodeViewModel class
     */
    function TreeNodeViewModel(tree, parentNode) {
        var self = this;
        self.childNodes = ko.observableArray();
        self.parentNode = ko.observable(parentNode);
        self.tree = tree;
        self.entity = ko.observable();

        self.key = ko.computed({
            read: function () {
                var kn = tree.keyName();
                if (kn && self.entity() && self.entity()[kn]) {
                    var k = self.entity()[kn];
                    if (typeof k === 'function') return k.call(self.entity());
                    return k;
                }
                return undefined;
            },
            deferEvaluation: true
        });

        self.isSelected = ko.computed(function () {
            return tree.selectedNode() === self;
        });

        self.isExpanded = ko.observable(false);

        self.addChildNode = function (node) {
            self.childNodes.push(node);
            node.parentNode(self);
        };

        self.hasChildNodes = ko.computed(function () {
            return self.childNodes() && self.childNodes().length;
        });
    }

    TreeNodeViewModel.prototype.selectNode = function () {
        this.tree.selectedNode(this);
        this.ensureVisible();
    };

    TreeNodeViewModel.prototype.toggleIsExpanded = function () {
        var nextValue = !this.isExpanded();
        this.isExpanded(nextValue);
    };

    TreeNodeViewModel.prototype.saveState = function (stateArray) {
        stateArray.push({
            key: this.key(),
            isExpanded: this.isExpanded()
        });
        ko.utils.arrayForEach(this.childNodes(), function (n) { n.saveState(stateArray); });
    };

    TreeNodeViewModel.prototype.restoreState = function (state) {
        if (state) {
            this.isExpanded(state.isExpanded);
        }
    };

    TreeNodeViewModel.prototype.ensureVisible = function () {
        var self = this,
            node = this.parentNode();
        while (node) {
            if (!node.isExpanded()) node.isExpanded(true);
            node = node.parentNode();
        }
    };
    
    return {
        TreeViewModel: TreeViewModel,
        TreeNodeViewModel: TreeNodeViewModel
    };
});