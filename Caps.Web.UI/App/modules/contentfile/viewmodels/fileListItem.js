define(['ko'], function (ko) {

    /*
     * FileListItem Class
     */
    function FileListItem(data, list) {
        var self = this;

        if (FileListItem.base)
            FileListItem.base.constructor.call(this, data, list);

        self.isUploading = ko.observable(false);
        self.isSelected = ko.observable(false);
        self.isSelectedItem = ko.computed(function () {
            return list.selectedItem() === self;
        });

        self.toggleSelected = function () {
            self.isSelected(!self.isSelected());
            if (self.isSelected()) list.selectItem(self);
        };

        self.selectItem = function () {
            list.selectItem(self);
        };
    }

    return FileListItem;
});