define(function (require) {

    function DraftTemplate(editor) {
        var self = this;
        this.name = 'DraftTemplate';
        this.editor = editor;

        self.editContentPart = function (templateCell) {
            var contentPart = self.editor.getOrCreateContentPart(templateCell.name);
            if (contentPart)
                self.editor.showContentPartEditor(contentPart);
        }
    }

    return DraftTemplate;
});