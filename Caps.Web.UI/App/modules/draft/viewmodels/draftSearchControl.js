define([
    'ko',
    '../datacontext',
    'infrastructure/listSortModel'
],
function (ko, datacontext, SortModel) {

    function DraftSearchControl() {
        var self = this;

        self.searchWords = ko.observable('');
        self.sortOptions = self.createSortOptions();

        self.search = function () {
            if (self.searchWords() && self.searchWords().length) {
                if (!datacontext.isValidUserQuery(self.searchWords()))
                    return false;
            }
            self.refreshResults();
        };
    }

    DraftSearchControl.prototype.createSortOptions = function () {
        var self = this;
        var columns = [
            new SortModel.ListColumn('Created.At', 'Erstellt am'),
            new SortModel.ListColumn('Created.By', 'Erstellt von'),
            new SortModel.ListColumn('Modified.At', 'Letzte Änderung'),
            new SortModel.ListColumn('Modified.By', 'Letzte Änderung von'),
            new SortModel.ListColumn('Name', 'Name')
        ];
        return new SortModel.SortOptions(columns, function () {
            self.refreshResults();
        }, 'Modified.At');
    };

    DraftSearchControl.prototype.refreshResults = function () {
        //TODO: Refresh list...
    };

    return DraftSearchControl;
});