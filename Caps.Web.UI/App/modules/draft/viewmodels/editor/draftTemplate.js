define(function (require) {

    function DraftTemplate(editor) {
        var self = this;
        this.title = 'DraftTemplate';
        this.editor = editor;

        self.editContentPart = function (templateCell) {
            alert('edit ' + templateCell.name);
        }
    }

    return DraftTemplate;
});