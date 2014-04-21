/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a model for sorting lists by a certain column.
 */
define([
    'require',
    'ko'
],
function (require, ko) {
    'use strict';
    
    /**
     * ListColumn class
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
     * SortOptions class
     */
    function SortOptions(columns, changeHandler, defaultSortColumn, defaultSortDirection) {
        var self = this;

        self.defaultSortColumn = defaultSortColumn || 'Created.At';
        self.defaultSortDirection = defaultSortDirection || 'desc';

        if (columns && columns.length)
            ko.utils.arrayForEach(columns, function (c) { c.owner = self; });
        self.columns = columns || [];

        self.selectedColumn = ko.observable();
        self.sortDirection = ko.observable(self.defaultSortDirection);
        
        var initialColumn = self.columns.length ? 
            ko.utils.arrayFirst(self.columns, function (c) { return c.name === self.defaultSortColumn; }) || self.columns[0] : null;
        self.selectedColumn(initialColumn);
        
        self.toggleSortDirection = function () {
            self.setSortDirection(self.sortDirection() == 'desc' ? 'asc' : 'desc');
        };
        
        self.sortAsc = function () { self.setSortDirection('asc'); };
        self.sortDesc = function () { self.setSortDirection('desc'); };

        self._callChangeHandler = function () {
            if (changeHandler && typeof changeHandler === 'function')
                changeHandler.apply(this);
        };

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
        var col = this.selectedColumn(),
            result;
        if (col) {
            result = col.name || this.defaultSortColumn;
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