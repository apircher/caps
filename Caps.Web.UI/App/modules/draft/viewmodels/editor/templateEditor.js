define(['ko'], function (ko) {

    function TemplateEditor(editor) {
        var self = this;
        self.name = "TemplateEditor";
        self.editor = editor;
        self.templateContent = ko.observable();

        if (editor.entity()) updateTemplateContent();
        
        function updateTemplateContent() {
            if (!editor.entity()) return;

            var template = editor.entity().template();
            var formattedTemplateContent = JSON.stringify(template, null, 4);
            self.templateContent(formattedTemplateContent);
        }

        self.templateContent.subscribe(function () {
            var modifiedTemplate;
            try {
                modifiedTemplate = JSON.parse(self.templateContent());
            }
            catch (error) {
                alert('Die Vorlage konnte nicht verarbeitet werden.');
                return;
            }

            self.editor.entity().Template(JSON.stringify(modifiedTemplate));
        });

        editor.entity.subscribe(updateTemplateContent);
    }

    return TemplateEditor;

});