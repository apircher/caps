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

        node.moveUp = function () {
            var orderedFiles = node.entity().Draft().orderedFiles().slice(0),
                index = orderedFiles.indexOf(node.entity());

            if (index <= 0)
                return;

            orderedFiles.splice(index, 1);
            orderedFiles.splice(index - 1, 0, node.entity());

            setRankings(orderedFiles);
            tree.refresh();
        };

        node.moveDown = function () {
            var orderedFiles = node.entity().Draft().orderedFiles().slice(0),
                index = orderedFiles.indexOf(node.entity());

            if (index >= orderedFiles.length - 1)
                return;

            orderedFiles.splice(index, 1);
            orderedFiles.splice(index + 1, 0, node.entity());

            setRankings(orderedFiles);
            tree.refresh();
        };

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

        function setRankings(files) {
            for (var i = 0; i < files.length; i++) {
                if (files[i].Ranking() !== i + 1)
                    files[i].Ranking(i + 1);
            }
        }

        return node;
    }
    DraftFileNode.prototype = new TreeModel.TreeNodeViewModel();

    /*
     * DraftFileViewModel
     */
    function DraftFileViewModel(draftFile, resource) {
        var self = this;
        self.draftFile = draftFile;
        self.language = resource.Language();
        self.resource = resource;

        self.fallbackResource = ko.computed(function () {
            return draftFile.getResource('de');
        });

        self.embedSrc = ko.computed(function () {
            if (self.resource && self.resource.FileVersion())
                return 'caps://content-file/' + escape(self.resource.FileVersion().File().FileName());
            return '';
        });

        self.moveUp = function () {
            var orderedFiles = self.draftFile.Draft().orderedFiles().slice(0),
                index = orderedFiles.indexOf(self.draftFile);

            if (index <= 0)
                return;

            orderedFiles.splice(index, 1);
            orderedFiles.splice(index - 1, 0, self.draftFile);

            setRankings(orderedFiles);
        };

        self.moveDown = function () {
            var orderedFiles = self.draftFile.Draft().orderedFiles().slice(0),
                index = orderedFiles.indexOf(self.draftFile);

            if (index >= orderedFiles.length - 1)
                return;

            orderedFiles.splice(index, 1);
            orderedFiles.splice(index + 1, 0, self.draftFile);

            setRankings(orderedFiles);
        };

        self.showGroup = ko.observable(false);
        self.selectGroup = function () {
            self.showGroup(true);
        };
        
        function setRankings(files) {
            for (var i = 0; i < files.length; i++) {
                if (files[i].Ranking() !== i + 1)
                    files[i].Ranking(i + 1);
            }
        }
    }

    /*
     * DraftFileGroup
     */
    function DraftFileGroup(draft, groupName) {
        var self = this;
        self.draft = ko.observable(draft);
        self.groupName = ko.observable(groupName);
        self.groupFilter = ko.observable(groupName);
        self.isExpanded = ko.observable(true);
        self.toggleIsExpanded = function () { self.isExpanded(!self.isExpanded()); };

        self.groupName.subscribe(function (newValue) {
            var files = self.files().slice(0);
            files.forEach(function (file) { file.draftFile.Group(newValue); });
            self.groupFilter(newValue);
        });

        self.files = ko.computed(function () {
            var draft = self.draft(),
            files = [];
            if (draft) {
                files = ko.utils.arrayMap(draft.filesByGroupName(self.groupFilter()), function (file) {
                    return new DraftFileViewModel(file, file.getOrCreateResource('de'));
                });
            }
            return files;
        });
        self.sortedFiles = ko.computed(function () {
            var result = self.files();
            result.sort(function (a, b) {
                if (!a || !a.draftFile || !b || !b.draftFile) return 0;
                var r1 = a.draftFile.Ranking(),
                    r2 = b.draftFile.Ranking();
                return r1 === r2 ? 0 : r1 < r2 ? -1 : 1;
            });
            return result;
        });
        
        self.groupFilter.subscribe(function (newValue) {
            var files = self.files().slice(0);
            files.forEach(function (f) { f.draftFile.Group(newValue); });
        });
    }

    DraftFileGroup.prototype.refresh = function () {
    };

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
            return self.contentPart.Name();
        }
    }

    return {
        DraftFileViewModel: DraftFileViewModel,
        DraftFileGroup: DraftFileGroup,
        DraftFileNode: DraftFileNode,

        ContentPartViewModel: ContentPartViewModel
    };
});