define(['require', 'moment'], function (require, moment) {

    function DraftProperties(editor) {
        var self = this;
        self.name = 'DraftProperties';
        self.editor = editor;

        self.createdBy = ko.computed(function () {
            return editor.entity().Created().By();
        });

        self.createdAt = ko.computed(function () {
            return moment(editor.entity().Created().At()).format('LLLL');
        });

        self.createdFromNow = ko.computed(function () {
            return moment(editor.entity().Created().At()).fromNow();
        });

        self.modifiedBy = ko.computed(function () {
            return editor.entity().Modified().By();
        });

        self.modifiedAt = ko.computed(function () {
            return moment(editor.entity().Modified().At()).format('LLLL');
        });

        self.modifiedFromNow = ko.computed(function () {
            return moment(editor.entity().Modified().At()).fromNow();
        });
    }

    return DraftProperties;

});