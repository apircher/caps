define(['require', 'ko'], function (require, ko) {

    function Navigation(editor) {
        var self = this;

        this.title = 'Navigation';
        this.editor = editor;

        this.currentView = ko.computed(function () {
            if (self.editor.currentContent())
                return self.editor.currentContent().name;
            return undefined;
        });
    }

    return Navigation;

});