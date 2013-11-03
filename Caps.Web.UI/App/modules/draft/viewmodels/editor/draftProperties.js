define(['require', 'moment'], function (require, moment) {

    function DraftProperties(editor) {
        var self = this;
        self.name = 'DraftProperties';
        self.editor = editor;
        self.moment = moment;
        self.resource = editor.entity().getResource('de');
    }

    return DraftProperties;

});