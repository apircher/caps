define(['require', 'moment', 'ko'], function (require, moment, ko) {

    function DraftProperties(editor) {
        var self = this;
        self.name = 'DraftProperties';
        self.editor = editor;
        self.moment = moment;
        self.resource = editor.entity().getResource(editor.language());

        self.fallbackResource = ko.computed(function () {
            return self.editor.entity().getResource('de');
        });
    }

    return DraftProperties;

});