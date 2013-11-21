define(['require', 'ko'], function (require, ko) {

    var contentEditorRegistry = {
        'text': './contentEditors/textEditor',
        'markdown': './contentEditors/markdownEditor',
        'html': './contentEditors/htmlEditor'
    };

    function ContentPartEditor(editor, contentPart) {        
        var self = this;
        self.name = 'ContentPartEditor';
        self.editor = editor;

        self.contentPart = contentPart;
        self.resource = contentPart.getResource('de');

        self.contentTypes = ko.observableArray([
            { title: 'HTML', value: 'html' },
            { title: 'Markdown', value: 'markdown' },
            { title: 'Text', value: 'text' }
        ]);

        self.contentEditor = ko.observable();

        self.templateCell = editor.template().findCell(contentPart.Name());
        self.title = self.templateCell ? self.templateCell.title : contentPart.Name();

        setContentEditor(contentPart.ContentType());
        contentPart.ContentType.subscribe(setContentEditor);

        function setContentEditor(contentType) {
            if (contentEditorRegistry[contentType]) {
                require([contentEditorRegistry[contentType]], function (ContentEditor) {
                    var ce = new ContentEditor();
                    ce.editor = editor;
                    ce.contentPart = contentPart;
                    ce.content = self.resource.Content;

                    self.contentEditor(ce);
                });
            }
        }
    }

    return ContentPartEditor;

});