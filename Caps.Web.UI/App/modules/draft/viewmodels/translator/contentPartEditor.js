define(['ko'], function (ko) {

    function ContentPartEditor(editor, contentPart, language) {
        this.name = 'ContentPartEditor';
        this.editor = editor;
        this.contentPart = contentPart;
        this.resource = contentPart.getOrCreateResource(language, editor.manager);        
        this.title = contentPart.Name();

        this.originalContent = htmlEscape(contentPart.getResource('de').Content()).replace(/\n/g, '<br />');

        this.copyOriginal = function () {
            this.resource.Content(contentPart.getResource('de').Content());
        };
    }

    function htmlEscape(str) {
        return String(str)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
    }

    return ContentPartEditor;

});