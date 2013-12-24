define(['require', 'ko', './editorModel'], function (require, ko, EditorModel) {

    function Navigation(editor) {
        var self = this;

        this.title = 'Navigation';
        this.editor = editor;

        this.currentView = ko.computed(function () {
            if (self.editor.currentContent())
                return self.editor.currentContent().name;
            return undefined;
        });

        this.contentParts = ko.computed(function () {
            if (self.editor.entity()) {
                var contentParts = self.editor.entity().ContentParts();
                contentParts.sort(sortByRanking);
                return ko.utils.arrayMap(contentParts, function (p) {
                    return new EditorModel.ContentPartViewModel(p, self.editor);
                });
            }
            return [];

            function sortByRanking(a, b) {
                return a.Ranking() === b.Ranking() || a.Ranking() < b.Ranking() ? -1 : 1;
            }
        });

        this.title = ko.computed(function () {
            var t = 'Unbenannt',
                entity = editor.entity();

            if (entity && entity.Name) {
                if (entity.Name().length)
                    t = entity.Name();
                else if (entity.entityAspect.entityState.name === 'Added')
                    t = 'Neuer Entwurf';
            }

            return t;
        });

        this.numberOfFiles = ko.computed(function () {
            if (self.editor.entity()) return self.editor.entity().Files().length;
            return 0;
        });
    }

    return Navigation;

});