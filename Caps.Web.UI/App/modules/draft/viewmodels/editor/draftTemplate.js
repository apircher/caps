define(function (require) {

    function DraftTemplate(editor) {
        var self = this;
        this.name = 'DraftTemplate';
        this.editor = editor;

        self.editContentPart = function (templateCell) {
            var contentPart = self.editor.getOrCreateContentPart(templateCell);
            if (contentPart)
                self.editor.showContentPartEditor(contentPart);
        };

        self.previewText = function (templateCell) {
            if (!templateCell || !templateCell.name) return '';
            var contentPart = self.editor.entity().findContentPart(templateCell.name);
            if (contentPart)
                return contentPart.previewText('de', 200);
        };
    }

    return DraftTemplate;
});