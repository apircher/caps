define(['../../contentGenerator'], function (contentGenerator) {

    function DraftTemplate(editor) {
        var self = this;
        this.name = 'DraftTemplate';
        this.editor = editor;
        this.showPreview = ko.observable(false);

        self.editContentPart = function (templateCell) {
            var contentPart = self.editor.getOrCreateContentPart(templateCell);
            if (contentPart)
                self.editor.showContentPartEditor(contentPart);
        };

        self.previewText = function (templateCell) {
            if (!templateCell || !templateCell.name) return '';
            var contentPart = self.editor.entity().findContentPart(templateCell.name);
            if (contentPart)
                return contentPart.previewText('de', 120);
        };

        self.prepareCellContent = function (templateCell) {
            if (!templateCell || !templateCell.name) return '';            
            var contentPart = self.editor.entity().findContentPart(templateCell.name);
            if (contentPart)
                return contentGenerator.createTemplateCellContent(self.editor.entity(), templateCell, 'de');
            return '';
        };

        self.togglePreview = function () {
            self.showPreview(!self.showPreview());
        };
    }

    return DraftTemplate;
});