define(['ko'], function () {

    function DraftNotesEditor(editor) {
        var self = this;

        self.name = 'DraftNotes';
        self.editor = editor;
    }

    return DraftNotesEditor;
});