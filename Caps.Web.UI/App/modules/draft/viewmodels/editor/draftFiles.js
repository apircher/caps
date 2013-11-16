define([
    'durandal/app',
    '../../module',
    'ko',
    '../editorModel'
],
function (app, module, ko, EditorModel) {

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
        var self = this;
        self.name = 'DraftFiles';
        self.editor = editor;
        self.groups = ko.observableArray(); 
        self.determinations = ko.observableArray(fileDeterminations);

        self.editor.entity().Files.subscribe(function () {
            refreshFileGroups();
        });
        
        self.selectFiles = function () {
            app.selectFiles({
                module: module,
                title: 'Dateien zu Entwurf "' + editor.entity().Name() + '" hinzufügen'
            }).then(function (result) {
                if (result.dialogResult) {
                    ko.utils.arrayForEach(result.selectedFiles, function (file) {
                        editor.createDraftFile(file);
                    });
                }
            });
        };

        self.addGroup = function () {
            self.groups.push(new EditorModel.DraftFileGroup(self.editor.entity(), 'Neue Gruppe'));
        };

        self.removeFile = function (file) {
            editor.files.remove(file);
            file.draftFile.setDeleted();
            editor.entity().Files.valueHasMutated();
        };

        function initializeGroups() {
            var draft = editor.entity(),
                distinctGroupNames = editor.entity().distinctFileGroupNames();
            self.groups(ko.utils.arrayMap(distinctGroupNames, function (groupName) {
                return new EditorModel.DraftFileGroup(draft, groupName);
            }));
        }

        function refreshFileGroups() {
            var draft = editor.entity(),
                distinctGroupNames = editor.entity().distinctFileGroupNames(),
                newGroupNames = ko.utils.arrayFilter(distinctGroupNames, function (s) { return !fileGroupExists(s); }),
                newGroups = ko.utils.arrayMap(newGroupNames, function (groupName) { return new EditorModel.DraftFileGroup(draft, groupName); });
            newGroups.forEach(function (g) { self.groups.push(g); });
        }

        function fileGroupExists(groupName) {
            return ko.utils.arrayFirst(self.groups(), function (g) { return g.groupName().toLowerCase() === groupName.toLowerCase(); });
        }

        initializeGroups();
    }

    return DraftFiles;
});