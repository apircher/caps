define(['require', 'ko'], function (require, ko) {

    function Navigation(editor) {
        var self = this;

        self.title = 'Navigation';
        self.editor = editor;
        self.contentParts = ko.observableArray();

        self.currentView = ko.computed(function () {
            if (self.editor.currentContent())
                return self.editor.currentContent().name;
            return undefined;
        });

        self.currentContentPart = ko.computed(function () {
            if (self.editor.currentContent() && self.editor.currentContent().name === 'ContentPartEditor')
                return self.editor.currentContent().contentPart.Name();
            return undefined;
        });

        self.entity = ko.computed(function () {
            return self.editor.entity();
        });

        function initContentPartItems() {
            var items = [];

            if (self.entity()) {
                var template = self.entity().template();
                ko.utils.arrayForEach(template.rows, function (row) {
                    ko.utils.arrayForEach(row.cells, function (cell) {
                        var contentPart = self.entity().findContentPart(cell.name);
                        if (contentPart) items.push(new ContentPartItem(contentPart, cell, editor));
                    });
                });
            }

            self.contentParts(items);
        }

        if (self.entity()) initContentPartItems();
        self.entity.subscribe(initContentPartItems);

        self.numberOfFiles = ko.computed(function () {
            var entity = self.entity();
            return entity ? entity.Files().length : 0;
        });
    }

    function ContentPartItem(contentPart, templateCell, editor) {
        var self = this;
        self.contentPart = contentPart;
        self.templateCell = templateCell;
        self.editor = editor;

        self.editContentPart = function () {
            editor.showContentPartEditor(contentPart);
        };
    }

    return Navigation;

});