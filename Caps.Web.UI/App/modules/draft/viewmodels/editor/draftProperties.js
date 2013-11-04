define(['require', 'moment'], function (require, moment) {

    function DraftProperties(editor, resource) {
        var self = this;
        self.name = 'DraftProperties';
        self.editor = editor;
        self.moment = moment;
        self.resource = resource;
    }

    return DraftProperties;

});