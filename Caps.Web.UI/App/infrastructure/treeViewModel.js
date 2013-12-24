define(['ko', 'infrastructure/interaction', 'infrastructure/keyCode'], function (ko, interaction, KeyCodes) {

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

    TreeViewModel.prototype.clear = function () {
        this.root.childNodes.removeAll();
    };

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
        if (state.selectedKey !== null && state.selectedKey !== undefined) {
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

    TreeViewModel.prototype.selectRootNode = function () {
        if (this.rootNodes().length)
            this.selectedNode(this.rootNodes()[0]);
    };

    TreeViewModel.prototype.handleKeyDown = function (e) {
        direction = KeyCodes.getDirection(e.keyCode);
        var self = this;

        if (direction) {
            e.preventDefault();

            if (!self.selectedNode()) {
                self.selectRootNode();
                return;
            }

            var n = self.selectedNode();
            if (direction === 'down') moveDown(n);
            if (direction === 'up') moveUp(n);
            if (direction === 'left') moveLeft(n);
            if (direction === 'right') moveRight(n);

            if (self.selectedNode())
                self.selectedNode().ensureVisible();
        }

        if (e.keyCode === KeyCodes.keys.SPACEBAR && self.selectedNode()) {
            e.preventDefault();
            self.selectedNode().toggleIsExpanded();
        }

        function moveDown(node) {
            if (node.hasChildNodes() && node.isExpanded())
                selectFirstChild(node);
            else {
                if (selectNextSibling(node))
                    return;
                if (node.parentNode())
                    selectNextSibling(node.parentNode());
            }
        }

        function moveUp(node) {
            var prev = node.previousSibling();
            if (prev && prev.hasChildNodes() && prev.isExpanded())
                selectLastChild(prev);
            else {
                if (!selectPreviousSibling(node))
                    selectParentNode(node);
            }
        }

        function moveLeft(node) {
            if (node.hasChildNodes() && node.isExpanded()) 
                node.isExpanded(false);
        }

        function moveRight(node) {
            if (node.hasChildNodes() && !node.isExpanded())
                node.isExpanded(true);
        }

        function selectFirstChild(node) {
            if (node.hasChildNodes()) {
                var nextSelection = node.childNodes()[0];
                self.selectedNode(nextSelection);
                return true;
            }
            return false;
        }

        function selectLastChild(node) {
            if (node.hasChildNodes()) {
                var nextSelection = node.childNodes()[node.childNodes().length -1];
                self.selectedNode(nextSelection);
                return true;
            }
            return false;
        }

        function selectParentNode(node) {
            if (node.parentNode() && node.parentNode() !== self.root) {
                self.selectedNode(node.parentNode());
                return true;
            }
            return false;
        }

        function selectNextSibling(node) {
            var next = node.nextSibling();
            if (next) {
                self.selectedNode(next);
                return true;
            }
            return false;
        }

        function selectPreviousSibling(node) {
            var next = node.previousSibling();
            if (next) {
                self.selectedNode(next);
                return true;
            }
            return false;
        }
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

        self.isSelected = ko.computed({
            read: function () {
                return self.tree && self.tree.selectedNode() === self;
            },
            deferEvaluation: true
        });

        self.isExpanded = ko.observable(false);

        self.addChildNode = function (node) {
            self.childNodes.push(node);
            node.parentNode(self);
        };

        self.detachFromParentNode = function () {
            if (self.isSelected()) {
                var nextSelection = self.nextSibling() || self.previousSibling() || self.parentNode();
                if (nextSelection)
                    nextSelection.selectNode();
            }

            self.parentNode().childNodes.remove(self);
            self.parentNode(null);
        };

        self.hasChildNodes = ko.computed(function () {
            return self.childNodes() && self.childNodes().length;
        });

        self.nextSibling = ko.computed({
            read: function () {
                var siblings = self.parentNode() ? self.parentNode().childNodes() : (self.tree ? self.tree.rootNodes() : [self]);
                var index = siblings.indexOf(self);

                if (index < siblings.length - 1)
                    return siblings[index + 1];
                return null;
            },
            deferEvaluation: true
        });

        self.previousSibling = ko.computed({
            read: function () {
                var siblings = self.parentNode() ? self.parentNode().childNodes() : (self.tree ? self.tree.rootNodes() : [self]);
                var index = siblings.indexOf(self);

                if (index > 0)
                    return siblings[index - 1];
                return null;
            },
            deferEvaluation: true
        });

        self.scrollIntoViewRequest = new interaction.InteractionRequest('ScrollIntoView');
    }
    
    TreeNodeViewModel.prototype.scrollIntoView = function () {
        this.scrollIntoViewRequest.trigger();
    };

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

        self.scrollIntoView();
    };
    
    return {
        TreeViewModel: TreeViewModel,
        TreeNodeViewModel: TreeNodeViewModel
    };
});