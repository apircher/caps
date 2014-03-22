define([
    'durandal/app',
    '../../module',
    'ko',
    './editorModel',
    'infrastructure/treeViewModel',
    'infrastructure/serverUtil',
    'infrastructure/keyboardHandler'
],
function (app, module, ko, EditorModel, TreeModel, server, KeyboardHandler) {

    var fileDeterminations = [
        {
            name: 'Picture',
            title: 'Bild'
        },
        {
            name: 'Download',
            title: 'Download'
        },
        {
            name: 'Misc',
            title: 'Sonstiges'
        }
    ];

    function DraftFiles(editor) {
        var self = this,
            fileGroups = ko.observableArray(),
            keyboardHandler = new KeyboardHandler(module);

        self.name = 'DraftFiles';
        self.editor = editor;
        self.server = server;
        self.determinations = ko.observableArray(fileDeterminations);
        self.tree = ko.observable();

        self.deactivate = function () {
            keyboardHandler.deactivate();
        };

        editor.currentContent.subscribe(function (nextValue) {
            if (nextValue === self) keyboardHandler.activate();
            else keyboardHandler.deactivate();
        });

        self.editor.entity().Files.subscribe(function () {
            refreshFileGroups();
            self.tree().refresh();
        });

        self.groupNames = ko.computed(function () {
            return ko.utils.arrayMap(fileGroups(), function (fileGroup) { return fileGroup.name(); });
        });

        self.sortedFileGroups = ko.computed(function () {
            var groups = fileGroups();
            groups.sort(function (a, b) { return a.name().toLowerCase().localeCompare(b.name().toLowerCase()); });
            return groups;
        });
        
        self.selectFiles = function () {
            app.selectFiles({
                module: module,
                title: 'Anhänge hinzufügen'
            }).then(function (result) {
                if (result.dialogResult) {
                    var groupName = findSelectedGroupName();
                    ko.utils.arrayForEach(result.selectedFiles, function (file) {
                        editor.createDraftFile(file, groupName);
                    });
                }
            });
        };

        self.addGroup = function () {
            var name = uniqueGroupName('Neue Gruppe');
            fileGroups.push(createFileGroup(name));
            self.tree().refresh();
            var groupNode = self.tree().findNodeByKey(name);
            if (groupNode) {
                groupNode.selectNode();
            }

            function uniqueGroupName(baseName) {
                var existingItems = ko.utils.arrayFilter(self.groupNames(), function (groupName) {
                    var rx = new RegExp('^(' + baseName + ')(\\s+\\(\\d+\\))?.*$', 'gi');
                    return rx.test(groupName);
                });

                if (!existingItems.length) return baseName;
                return baseName + ' (' + existingItems.length + ')';
            }
        };

        self.moveSelectedNodeUp = function () {
            var n = self.tree().selectedNode();
            if (n.moveUp) n.moveUp();
        };

        self.moveSelectedNodeDown = function () {
            var n = self.tree().selectedNode();
            if (n.moveDown) n.moveDown();
        };

        self.removeFile = function (file) {
            var btnOk = 'Entfernen', btnCancel = 'Abbrechen';
            app.showMessage('Soll der Anhang ' + file.entity().Name() + ' wirklich entfernt werden?', 'Anhang entfernen', [btnOk, btnCancel]).then(function (dialogResult) {
                if (dialogResult === btnOk) {
                    file.detachFromParentNode();
                    file.entity().setDeleted();
                }
            });
        };

        self.contentTemplateName = function () {
            if (!self.tree() || !self.tree().selectedNode())
                return '';
            var n = self.tree().selectedNode();
            return n.nodeType == 'group' ? 'draftfiles-group-template' : 'draftfiles-file-template';
        };

        self.navigateToFile = function () {
            if (self.tree() && self.tree().selectedNode() && self.tree().selectedNode().nodeType === 'file') {
                var vm = self.tree().selectedNode(),
                    file = vm.resource.FileVersion().File();
                app.trigger('caps:contentfile:navigateToFile', file);
            }
        };

        function initializeFileGroups() {
            var distinctGroupNames = editor.entity().distinctFileGroupNames();
            fileGroups(ko.utils.arrayMap(distinctGroupNames, createFileGroup));
        }

        function refreshFileGroups() {
            var distinctGroupNames = editor.entity().distinctFileGroupNames();
            var newGroupNames = ko.utils.arrayFilter(distinctGroupNames, function (groupName) {
                return !hasGroup(groupName);
            });
            ko.utils.arrayForEach(newGroupNames, function (groupName) {
                fileGroups.push(createFileGroup(groupName));
            });

            function hasGroup(groupName) {
                return ko.utils.arrayFirst(fileGroups(), function (g) { return g.name().toLowerCase() === groupName.toLowerCase(); }) ? true : false;
            }
        }

        function initializeTree() {
            var t = new TreeModel.TreeViewModel(),
                draft = editor.entity();

            t.keyName('Id');
            t.createNode = function () {
                var node = new TreeModel.TreeNodeViewModel(t);
                node.templateName = ko.observable();
                return node;
            };

            t.refresh = function () {
                var ts;
                if (self.tree()) ts = self.tree().saveState();
                t.clear();
                ko.utils.arrayForEach(self.sortedFileGroups(), function (fileGroup) {
                    var groupNode = createGroupNode(t, fileGroup);
                    t.root.addChildNode(groupNode);
                    var groupFiles = draft.filesByGroupName(fileGroup.name());
                    ko.utils.arrayForEach(groupFiles, function (f) {
                        groupNode.addChildNode(createFileNode(t, f));
                    });
                });
                if (ts && self.tree()) self.tree().restoreState(ts);
            };

            self.tree(t);
        }

        function createGroupNode(tree, fileGroup) {
            var groupNode = tree.createNode();
            groupNode.title = ko.observable(fileGroup.name());
            groupNode.nodeType = 'group';
            groupNode.entity(fileGroup);
            groupNode.templateName = ko.computed(function () {
                return groupNode.title().length ? 'draftfilegroup-label' : 'draftfilegroup-label-empty';
            });
            groupNode.groupName = ko.computed({
                read: function () {
                    return groupNode.entity().name();
                },
                write: function (newValue) {
                    if (newValue === fileGroup.name()) return;

                    groupNode.entity().name(newValue);
                    groupNode.childNodes().forEach(function (n) { n.entity().Group(newValue); });
                    tree.refresh();
                }
            });

            return groupNode;
        }

        function createFileNode(tree, file) {
            var fileNode = new EditorModel.DraftFileNode(file, file.getOrCreateResource('de'), tree);
            fileNode.title = file.Name();
            fileNode.templateName = ko.observable('draftfile-label');
            return fileNode;
        }

        function findSelectedGroupName() {
            if (!self.tree() || !self.tree().selectedNode())
                return '';
            var node = self.tree().selectedNode();
            if (node.nodeType === 'group')
                return node.title();

            return node.parentNode().title();
        }

        function createFileGroup(groupName) {
            var g = {
                name: ko.observable(groupName)
            };
            g.Id = ko.computed(function () { return g.name(); });
            return g;
        }

        initializeFileGroups();
        initializeTree();

        if (self.tree()) {
            self.tree().refresh();
            self.tree().expandRootNodes();
            self.tree().selectRootNode();
        }

        keyboardHandler.keydown = function (e) {
            var curElement = document.activeElement;
            if (self.tree() && !(curElement && (curElement.tagName == 'INPUT' || curElement.tagName == 'TEXTAREA'))) self.tree().handleKeyDown(e);
        };
    }

    return DraftFiles;
});