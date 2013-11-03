define(['ko'], function (ko) {

    function ContentPartEditor(editor, contentPart, language) {
        this.name = 'ContentPartEditor';
        this.editor = editor;
        this.contentPart = contentPart;
        this.resource = contentPart.getOrCreateResource(language, editor.manager);        
        this.title = contentPart.PartType();

        this.originalContent = contentPart.getResource('de').Content();
    }

    return ContentPartEditor;

});