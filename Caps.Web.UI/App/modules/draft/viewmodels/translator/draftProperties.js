define(['require', 'moment', 'ko'], function (require, moment, ko) {

    function DraftProperties(editor) {
        var self = this;
        self.name = 'DraftProperties';
        self.editor = editor;
        self.moment = moment;
        self.translation = editor.entity().getTranslation(editor.language().culture);
    }

    return DraftProperties;

});