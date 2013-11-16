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

        this.numberOfFiles = ko.computed(function () {
            if (self.editor.entity()) return self.editor.entity().Files().length;
            return 0;
        });
    }

    return Navigation;

});