define(['require', 'ko'], function (require, ko) {

    function Navigation(editor) {
        var self = this;

        self.title = 'Navigation';
        self.editor = editor;

        self.currentView = ko.computed(function () {
            if (self.editor.currentContent())
                return self.editor.currentContent().name;
            return undefined;
        });

        self.currentContentPart = ko.computed(function () {
            if (self.editor.currentContent() && self.editor.currentContent().name === 'ContentPartEditor')
                return self.editor.currentContent().contentPart.PartType();
            return undefined;
        });

        self.entity = ko.computed(function () {
            return self.editor.entity();
        });
        
        self.editContentPart = function (contentPart) {
            self.editor.showContentPartEditor(contentPart);
        };
    }

    return Navigation;

});