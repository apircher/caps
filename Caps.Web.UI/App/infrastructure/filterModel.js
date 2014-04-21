/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a model for general filters like a Tag-Filter.
 */
define([
    'require',
    'ko'
],
function (require, ko) {
    'use strict';
    
    /**
     * FilterItem Class
     */
    function FilterItem(filterName, filterTitle, filterValue) {
        var self = this;
        self.name = filterName;
        self.title = filterTitle;
        self.value = filterValue;

        self.isSelected = ko.observable(true);
        self.toggleSelect = function () {
            self.isSelected(!self.isSelected());
        };
    }

    FilterItem.prototype.clone = function () {
        var result = new FilterItem(this.name, this.title, this.value);
        result.isSelected(this.isSelected());
        return result;
    };

    /**
     * FilterOptions Class
     */
    function FilterOptions(filterItems) {
        var self = this;

        if (filterItems && filterItems.length) {
            filterItems.sort(function (f1, f2) { return f1.title.localeCompare(f2.title); });
        }

        self.filters = ko.observableArray(filterItems || []);

        self.selectedFilters = ko.computed(function () {
            return ko.utils.arrayFilter(self.filters(), function (item) {
                return item.isSelected();
            });
        });

        self.clear = function () {
            self.filters([]);
        };

        self.reset = function () {
            ko.utils.arrayForEach(self.selectedFilters(), function (item) {
                item.isSelected(false);
            });
        };

        self.showOthers = ko.observable(true);

        self.toggleShowOthers = function () {
            self.showOthers(!self.showOthers());
        };

        self.allSelected = ko.computed({
            read: function () {
                for (var i = 0; i < self.filters().length; i++) {
                    if (!self.filters()[i].isSelected()) return false;
                }
                if (!self.showOthers()) return false;
                return true;
            },
            write: function (val) {
                ko.utils.arrayForEach(self.filters(), function (f) {
                    if (f.isSelected() !== val) f.isSelected(val);
                });
                self.showOthers(val);
            }
        });

        self.toggleAll = function () {
            self.allSelected(!self.allSelected());
        };
    }

    FilterOptions.prototype.clone = function () {
        var items = ko.utils.arrayMap(this.filters(), function (filter) {
            return filter.clone();
        });
        var fo = new FilterOptions(items);
        fo.showOthers(this.showOthers());
        return fo;
    };

    FilterOptions.prototype.createOrUpdateFilter = function (title, name, value) {
        var item = this.findFilter(value);
        if (!item) {
            item = new FilterItem(name, title, value);
            this.filters.push(item);
        }
        else {
            item.title = title;
            item.value = value;
        }
    };

    FilterOptions.prototype.add = function (filterItem) {
        this.filters.push(filterItem);
        this.filters.sort(function (f1, f2) { return f1.title.localeCompare(f2.title); });
    };

    FilterOptions.prototype.findFilter = function (value) {
        return ko.utils.arrayFirst(this.filters(), function (item) {
            return item.value === value;
        });
    };

    FilterOptions.prototype.toString = function () {
        if (this.allSelected()) return '';

        var items = this.selectedFilters();
        var result = '';
        for (var i = 0; i < items.length; i++) {
            var key = items[i].value;
            if (key) result += key + (i < items.length - 1 ? '|' : '');
        }
        if (this.showOthers()) result += '|others';
        return result;
    };

    return {
        FilterItem: FilterItem,
        FilterOptions: FilterOptions
    };
});