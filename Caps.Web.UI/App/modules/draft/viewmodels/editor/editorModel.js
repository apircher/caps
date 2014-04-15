define(['ko', 'infrastructure/treeViewModel'], function (ko, TreeModel) {

    /**
     * DraftFileNode
     */
    function DraftFileNode(draftFile, resource, tree, parentNode) {
        var self = this,
            node = new TreeModel.TreeNodeViewModel(tree, parentNode);

        node.entity(draftFile);
        node.language = resource.Language();
        node.resource = resource;
        node.nodeType = 'file';

        node.fallbackResource = ko.computed(function () {
            return draftFile.getResource('de');
        });

        node.embedSrc = ko.computed(function () {
            if (node.resource && node.resource.FileVersion())
                return 'caps://content-file/' + escape(node.resource.FileVersion().File().FileName());
            return '';
        });

        node.showGroup = ko.observable(false);
        node.selectGroup = function () {
            node.showGroup(true);
        };
        node.cancelSelectGroup = function () {
            node.showGroup(false);
        };

        node.groupNameChanged = function () {
            tree.refresh();
        };

        return node;
    }
    DraftFileNode.prototype = new TreeModel.TreeNodeViewModel();
    

    /**
     * ContentPartViewModel
     */
    function ContentPartViewModel(contentPart, editor, title) {
        var self = this;

        title = title || findTitle();

        self.contentPart = contentPart;
        self.title = ko.observable(title);

        self.edit = function () {
            editor.showContentPartEditor(contentPart);
        };

        function findTitle() {
            if (editor.entity()) {
                var template = editor.entity().template();
                var cell = template.findCell(contentPart.Name());
                if (cell) return cell.title;
            }
            if (self.contentPart)
                return self.contentPart.Name();
            return '';
        }
    }

    return {
        DraftFileNode: DraftFileNode,
        ContentPartViewModel: ContentPartViewModel
    };
});