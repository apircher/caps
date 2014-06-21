define([
    'durandal/app',
    '../../module',
    'ko',
    './editorModel',
    'infrastructure/treeViewModel',
    'infrastructure/serverUtil',
    'infrastructure/keyboardHandler',
    'infrastructure/urlHelper'
],
function (app, module, ko, EditorModel, TreeModel, server, KeyboardHandler, urlHelper) {

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
        self.urlHelper = urlHelper;

        self.deactivate = function () {
            keyboardHandler.deactivate();
        };

        editor.currentContent.subscribe(function (nextValue) {
            if (nextValue === self) keyboardHandler.activate();
            else keyboardHandler.deactivate();
        });

        var autoRefreshTree = true;
        self.editor.entity().Files.subscribe(function () {
            if (autoRefreshTree) {
                refreshFileGroups();
                self.tree().refresh();
            }
        });

        self.groupNames = ko.computed(function () {
            return ko.utils.arrayMap(fileGroups(), function (fileGroup) { return fileGroup.name(); });
        });

        self.sortedFileGroups = ko.computed(function () {
            var groups = fileGroups();
            groups.sort(function (a, b) {
                var rankingA = editor.entity().rankingByGroupName(a.name()),
                    rankingB = editor.entity().rankingByGroupName(b.name());
                return rankingA === rankingB ? 0 : (rankingA < rankingB ? -1 : 1);
            });
            return groups;
        });
        
        self.selectFiles = function () {
            app.selectFiles({
                module: module,
                title: 'Anhänge hinzufügen'
            }).then(function (result) {
                if (result.dialogResult) {
                    var groupName = findSelectedGroupName(),
                        ranking = editor.entity().rankingByGroupName(groupName);
                    ko.utils.arrayForEach(result.selectedFiles, function (file) {
                        editor.createDraftFile(file, groupName, ranking++);
                    });
                    saveDraftFileRankings();
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
                groupNode.isExpanded(true);
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

        self.ensureGroupsExist = function (groupNames) {
            groupNames.forEach(function (name) {
                if (!groupNameExists(name)) {
                    fileGroups.push(createFileGroup(name));
                }
                self.tree().refresh();
                self.tree().selectRootNode();
            });
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

        self.deleteGroup = function () {
            var group = selectedGroupNode();
            if (!group) return;

            var attachmentsToRemove = ko.utils.arrayMap(group.childNodes(), function (n) { return n.entity(); });
            if (attachmentsToRemove.length > 0) {
                var btnOk = 'Gruppe löschen', btnCancel = 'Abbrechen';
                app.showMessage('Soll die Gruppe "' + group.title() + '" wirklich gelöscht werden?', 'Gruppe löschen', [btnOk, btnCancel]).then(function (dialogResult) {
                    if (dialogResult === btnOk) deleteGroupConfirmed();
                });
            }
            else
                deleteGroupConfirmed();

            function deleteGroupConfirmed() {
                fileGroups.remove(group.entity());
                group.detachFromParentNode();
                autoRefreshTree = false;
                ko.utils.arrayForEach(attachmentsToRemove, function (attachment) {
                    attachment.setDeleted();
                });
                autoRefreshTree = true;
            }
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

            var selectedGroup = selectedGroupNode();
            ko.utils.arrayForEach(newGroupNames, function (groupName) {
                fileGroups.push(createFileGroup(groupName));
            });

            var tree = self.tree();
            if (!selectedGroup && tree) {
                tree.selectRootNode();
                tree.expandRootNodes();
            }

            function hasGroup(groupName) {
                return ko.utils.arrayFirst(fileGroups(), function (g) { return g.name().toLowerCase() === groupName.toLowerCase(); }) ? true : false;
            }
        }

        function groupNameExists(groupName) {
            var existingItems = ko.utils.arrayFilter(self.groupNames(), function (gn) {
                var rx = new RegExp('^(' + groupName + ')(\\s+\\(\\d+\\))?.*$', 'gi');
                return rx.test(gn);
            });
            return existingItems.length > 0;
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
                        var n = createFileNode(t, f);
                        if (n) groupNode.addChildNode(n);
                    });
                });
                if (ts && self.tree()) self.tree().restoreState(ts);
            };

            t.on('tree:nodeMoved', function (node) {
                saveDraftFileRankings();
            });

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
            if (!file) return null;

            var fileNode = new EditorModel.DraftFileNode(file, file.getOrCreateResource('de'), tree);
            fileNode.title = file.Name();
            fileNode.templateName = ko.observable('draftfile-label');
            return fileNode;
        }

        function findSelectedGroupName() {
            var node = selectedGroupNode();
            return node ? node.title() : '';
        }

        function selectedGroupNode() {
            if (!self.tree() || !self.tree().selectedNode())
                return null;
            var node = self.tree().selectedNode();
            return node.nodeType === 'group' ? node : node.parentNode();
        }

        function createFileGroup(groupName) {
            var g = {
                name: ko.observable(groupName)
            };
            g.Id = ko.computed(function () { return g.name(); });
            return g;
        }

        function saveDraftFileRankings() {
            var t = self.tree(),
                r = 0;
            if (t) {
                ko.utils.arrayForEach(t.rootNodes(), function (groupNode) {
                    ko.utils.arrayForEach(groupNode.childNodes(), function (draftFileNode) {
                        var entity = draftFileNode.entity(),
                            ranking = r++;
                        if (entity.Ranking() !== ranking)
                            entity.Ranking(ranking);
                    });
                });
            }
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