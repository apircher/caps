define(['durandal/app', '../../module', 'ko'], function (app, module, ko) {

    function DraftFiles(editor) {
        var self = this;
        self.name = 'DraftFiles';
        self.editor = editor;
    }

    return DraftFiles;
});