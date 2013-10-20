define(['durandal/app', '../../module', 'ko'], function (app, module, ko) {

    function DraftFiles(editor) {
        var self = this;
        self.title = 'DraftFiles';
        self.editor = editor;

        self.selectFiles = function () {
            app.selectFiles({
                module: module,
                title: 'Dateien für ' + editor.entity().Name() + ' wählen'
            }).then(function (result) {
                if (result.dialogResult) {
                    ko.utils.arrayForEach(result.selectedFiles, function (file) {
                        editor.createDraftFile(file);
                    });
                }
            });
        };

        self.removeFile = function (file) {
            file.setDeleted();
            editor.entity().Files.valueHasMutated();
        };
    }

    return DraftFiles;
});