define(['ko'], function (ko) {

    function ContentPartEditor(editor, contentPart) {
        this.title = contentPart.PartType();
        this.name = 'ContentPartEditor';
        this.editor = editor;
        this.contentPart = contentPart;
        this.resource = contentPart.findResource('de');
        this.contentTypes = ko.observableArray([
            { title: 'HTML', value: 'html' },
            { title: 'Markdown', value: 'markdown' },
            { title: 'Text', value: 'text' }
        ]);
    }

    return ContentPartEditor;

});