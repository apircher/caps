/*global define*/

/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a model for representing lazy lists.
 */
define([
    'require',
    'ko'
],
function (require, ko) {
    'use strict';

    /**
     * VirtualListItem Class
     */
    function VirtualListItem(data, list) {
        var self = this;
        self.data = ko.observable(data);
        self.list = list;
    }

    /**
     * VirtualListPage Class
     */
    function VirtualListPage(pageIndex, data, isLoaded) {
        var self = this;
        self.index = pageIndex;
        self.setItems(data, isLoaded);
    }

    VirtualListPage.prototype.setItems = function (data, isLoaded) {
        this.items = data;
        this.count = data && data.length ? data.length : 0;
        this.isLoading = false;
        this.isLoaded = isLoaded !== undefined ? isLoaded : (data && data.length > 0);
    };

    /**
     * VirtualList Class
     */
    function VirtualList(itemsPerPage, data, ListItemType) {
        var self = this;

        self.ListItemType = VirtualListItem;
        if (ListItemType && typeof ListItemType === 'function') {
            var surrogateCtor = function () { };
            surrogateCtor.prototype = VirtualListItem.prototype;
            ListItemType.prototype = new surrogateCtor();
            ListItemType.prototype.constructor = ListItemType;
            ListItemType.base = VirtualListItem.prototype;
            self.ListItemType = ListItemType;
        }

        self.itemsPerPage = ko.observable(itemsPerPage || 10);
        self.count = ko.observable(0);
        self.pages = ko.observableArray([]);
        self.items = ko.computed(function () { return self.getItems.call(self); });
        self.suspendEvents = false;
        self.selectedItem = ko.observable();
        self.selectedItems = ko.computed(function () {
            return ko.utils.arrayFilter(self.items(), function (f) {
                return f.isSelected();
            });
        });

        if (data) this.addPage(data, 1);
    }

    VirtualList.prototype.getItems = function () {
        var result = [],
            self = this;
        result = result.concat.apply(result, ko.utils.arrayMap(self.pages(), function (p) { return p.items; }));
        return result;
    };

    VirtualList.prototype.addItem = function (data) {
        var self = this,
            vm = new self.ListItemType(data, self),
            page = self.pages().length ? self.pages()[0] : undefined;
        if (!page) {
            page = new VirtualListPage(self.pages().length, [vm], true);
            self.pages().push(page);
        }
        else {
            page.items.push(vm);
            page.count++;
        }
        self.count(self.count() + 1);
        self.raiseItemsChanged();
        return vm;
    };

    VirtualList.prototype.insertItem = function (data, index) {
        var self = this,
            arr = self.items();

        if (index < 0 || index >= arr.length) 
            return self.addItem(data);

        var item = arr[index],
            vm = new self.ListItemType(data, self),
            page = self.findItemPage(item),
            indexInPage = page.items.indexOf(item);

        page.items.splice(indexInPage, 0, vm);
        page.count++;
        self.count(self.count() + 1);
        self.raiseItemsChanged();
        return vm;
    };

    VirtualList.prototype.removeItem = function (item) {
        var page = this.findItemPage(item);
        if (page) {
            var index = page.items.indexOf(item);
            page.items.splice(index, 1);
            page.count--;
            this.count(this.count() - 1);
            this.raiseItemsChanged();
        }
    };

    VirtualList.prototype.addPage = function (data, pageNumber) {
        if (data.inlineCount && data.inlineCount !== this.count()) {
            this.count(data.inlineCount);
            this._buildPages(data.inlineCount, this.itemsPerPage());
        }
        this._addItems(data.results, pageNumber - 1);
    };

    VirtualList.prototype.findPage = function (pageNumber) {
        if (this.pages().length <= 0 || this.pages().length < pageNumber)
            return null;
        return this.pages()[pageNumber - 1];
    };

    VirtualList.prototype.findItem = function (evaluator) {
        return ko.utils.arrayFirst(this.getItems(), evaluator);
    };

    VirtualList.prototype.isPageLoaded = function (pageNumber) {
        var page = this.findPage(pageNumber);
        return page ? page.isLoaded : false;
    };

    VirtualList.prototype.isPageLoading = function (pageNumber) {
        var page = this.findPage(pageNumber);
        return page ? page.isLoading : false;
    };

    VirtualList.prototype.markPageLoading = function (pageNumber) {
        var page = this.findPage(pageNumber);
        if (page) page.isLoading = true;
    };

    VirtualList.prototype.markPageLoaded = function (pageNumber) {
        var page = this.findPage(pageNumber);
        if (page) {
            page.isLoading = false;
            page.isLoaded = true;
        }
    };

    VirtualList.prototype.removeAll = function () {
        this.pages([]);
        this.count(0);
    };

    VirtualList.prototype.findItemPage = function (item) {
        var pagesArray = this.pages();
        for (var i = 0; i < pagesArray.length; i++) {
            var page = pagesArray[i];
            if (page.items.indexOf(item) >= 0)
                return page;
        }
        return null;
    };

    VirtualList.prototype.raiseItemsChanged = function () {
        if (!this.suspendEvents)
            this.pages.valueHasMutated();
    };

    VirtualList.prototype.selectItem = function (item) {
        if (this.selectedItem() !== item)
            this.selectedItem(item);
    };

    VirtualList.prototype.resetSelection = function () {
        this.selectedItem(null);
    };

    VirtualList.prototype._addItems = function (data, pageIndex) {
        var self = this,
            items = ko.utils.arrayMap(data, function (d) {
                return new self.ListItemType(d, self);
            }),
            page = self.pages()[pageIndex];
        if (page) {
            self.pages()[pageIndex].setItems(items);
            self.pages.valueHasMutated();
        }
    };

    VirtualList.prototype._buildPages = function (numItems, itemsPerPage) {
        console.log('_buildPages called. numItems=' + numItems + ', itemsPerPage=' + itemsPerPage);
        var self = this,
            numPages = Math.ceil(self.count() / self.itemsPerPage()),
            arr = [];
        for (var pageIndex = 0; pageIndex < numPages; pageIndex++) {
            var isLastPage = pageIndex === numPages - 1,
                length = isLastPage ? numItems - (pageIndex * itemsPerPage) : itemsPerPage,
                page = new VirtualListPage(pageIndex, buildDummyItems.call(self, length), false);
            arr.push(page);
        }
        self.pages(arr);

        function buildDummyItems(count) {
            var dummies = [];
            for (var i = 0; i < count; i++)
                dummies.push(new self.ListItemType(undefined, self));
            return dummies;
        }
    };

    return {
        VirtualList: VirtualList,
        VirtualListItem: VirtualListItem
    };

});