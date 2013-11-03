/*
 * listSortModel.js
 */
define([
    'require',
    'ko'
],
function (require, ko) {
    
    /**
     * ListColumn Class
     */
    function ListColumn(name, title, owner) {
        var self = this;
        self.name = name;
        self.title = title;
        self.owner = owner;

        self.sort = function () {
            if (self.owner) self.owner.selectedColumn(self);
        };

        self.isSelected = ko.computed({
            read: function () {
                return self.owner && self.owner.selectedColumn() === self;
            },
            deferEvaluation: true
        });
    }

    /**
     * SortOptions Class
     */
    function SortOptions(columns, changeHandler) {
        var self = this;

        if (columns && columns.length)
            ko.utils.arrayForEach(columns, function (c) { c.owner = self; });
        self.columns = columns || [];

        self.selectedColumn = ko.observable();
        self.sortDirection = ko.observable('desc');
        
        self.selectedColumn(self.columns[0]);
        
        self.toggleSortDirection = function () {
            self.setSortDirection(self.sortDirection() == 'desc' ? 'asc' : 'desc');
        };
        
        self.sortAsc = function () { self.setSortDirection('asc'); };
        self.sortDesc = function () { self.setSortDirection('desc'); };

        self._callChangeHandler = function () {
            if (changeHandler && typeof changeHandler === 'function')
                changeHandler.apply(this);
        }

        self.selectedColumn.subscribe(self._callChangeHandler);
        self.sortDirection.subscribe(self._callChangeHandler);
    }

    SortOptions.prototype.setSortDirection = function (direction) {
        if (this.sortDirection() !== direction) {
            this.sortDirection(direction);
            this._callChangeHandler();
        }
    };
    
    SortOptions.prototype.getOrderBy = function () {
        var col = this.selectedColumn();
        if (col) {
            var result = col.name || 'Created.At';
            if (this.sortDirection() && this.sortDirection().toLowerCase() === 'desc')
                result += ' desc';
        }
        return result;
    };

    return {
        ListColumn: ListColumn,
        SortOptions: SortOptions
    };
});