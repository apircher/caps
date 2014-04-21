/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

define([
    'ko',
    'infrastructure/filterModel',
    'infrastructure/listSortModel',
    'infrastructure/tagService',
    '../datacontext'
],
function (ko, FilterModel, SortModel, tagService, datacontext) {
    'use strict';

    /**
     * FileSearchControl class
     */
    function FileSearchControl() {
        var self = this;

        self.searchWords = ko.observable('');
        self.sortOptions = self.createSortOptions();
        self.tagFilterOptions = null;
        self.filterOptions = ko.observable();
        self.currentFilter = '';

        self.hasFilterOptions = ko.computed(function () {
            return tagService.tags() && tagService.tags().length > 0;
        });
                
        self.beginSetFilter = function () {
            self.tagFilterOptions = self.tagFilterOptions || self.createTagFilterOptions();
            self.filterOptions(self.tagFilterOptions.clone());
            return true;
        };

        self.endSetFilter = function () {
            var filter = self.filterOptions().toString();
            if (filter !== self.currentFilter) {
                self.tagFilterOptions = self.filterOptions();
                self.currentFilter = filter;
                self.refreshResults();
            }
            self.filterOptions(null);
        };

        self.search = function () {
            if (self.searchWords() && self.searchWords().length) {
                if (!datacontext.isValidUserQuery(self.searchWords()))
                    return false;
            }
            self.refreshResults();
        };
    }

    FileSearchControl.prototype.createTagFilterOptions = function () {
        var items = ko.utils.arrayMap(tagService.tags(), function (t) { return createTagFilterItem(t); });
        return new FilterModel.FilterOptions(items);
    };
    
    FileSearchControl.prototype.createSortOptions = function () {
        var self = this;
        var columns = [
            new SortModel.ListColumn('Created.At', 'Hochgeladen am'),
            new SortModel.ListColumn('Created.By', 'Hochgeladen von'),
            new SortModel.ListColumn('Modified.At', 'Letzte Änderung'),
            new SortModel.ListColumn('Modified.By', 'Letzte Änderung von'),
            new SortModel.ListColumn('FileName', 'Dateiname')
        ];
        return new SortModel.SortOptions(columns, function () {
            self.refreshResults();
        });
    };

    FileSearchControl.prototype.refreshResults = function () {
        //TODO: Refresh list...
    };

    FileSearchControl.prototype.addTagFilter = function (tag) {
        if (this.tagFilterOptions) this.tagFilterOptions.add(createTagFilterItem(tag));
    };

    FileSearchControl.prototype.removeTagFilter = function (tag) {
        if (this.tagFilterOptions) {
            var filter = this.tagFilterOptions.findFilter(tag.Id());
            if (filter) this.tagFilterOptions.filters.remove(filter);
        }
    };
    
    function createTagFilterItem(tag) {
        return new FilterModel.FilterItem('DbFileTag', tag.Name(), tag.Id());
    }

    return FileSearchControl;
});