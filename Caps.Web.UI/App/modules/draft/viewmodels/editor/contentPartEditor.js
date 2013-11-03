define(['ko'], function (ko) {

    function ContentPartEditor(editor, contentPart) {        
        this.name = 'ContentPartEditor';
        this.editor = editor;
        this.contentPart = contentPart;
        this.resource = contentPart.getResource('de');
        this.contentTypes = ko.observableArray([
            { title: 'HTML', value: 'html' },
            { title: 'Markdown', value: 'markdown' },
            { title: 'Text', value: 'text' }
        ]);

        this.title = contentPart.PartType();
        this.templateCell = editor.template().findCell(contentPart.PartType());
        if (this.templateCell) {
            this.title = this.templateCell.title;
        }
    }

    return ContentPartEditor;

});