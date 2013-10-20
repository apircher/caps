define(['plugins/fileSelection', 'plugins/dialog', 'ko', './fileListItem', 'durandal/system', '../datacontext', 'infrastructure/virtualListModel', './fileSearchControl'
], function (fileSelection, dialog, ko, FileListItem, system, datacontext, VirtualListModel, FileSearchControl) {

    function FileSelectionDialog(options) {
        var self = this;
        options = options || {};

        self.title = options.title || 'Dateien hinzufügen';
        self.list = new VirtualListModel.VirtualList(35, null, FileListItem);
        self.isLoading = ko.observable(false);        
        self.selectedFile = self.list.selectedItem;
        self.selectedFiles = self.list.selectedItems;
        self.initialized = false;
        self.searchControl = new FileSearchControl();

        self.searchControl.refreshResults = function () {
            self.list.resetSelection();
            self.list.removeAll();
            self.loadPage(1);
        };

        self.loadHandler = function (element, e) {
            var firstPage = e.firstVisible.viewModel ? self.list.findItemPage(e.firstVisible.viewModel) : undefined;
            var lastPage = e.lastVisible.viewModel ? self.list.findItemPage(e.lastVisible.viewModel) : undefined;
            if (firstPage && lastPage) {
                for (var i = firstPage.index; i <= lastPage.index; i++) {
                    checkPage.call(self, i + 1);
                }
            }
            function checkPage(pageNumber) {
                var page = this.list.findPage(pageNumber);
                if (!page.isLoaded && !page.isLoading) {
                    this.list.markPageLoading(pageNumber);
                    this.loadPage(pageNumber).then(function () {
                        this.list.markPageLoaded(pageNumber);
                        e.pageLoaded(pageNumber);
                    });
                }
            }
        };
    }

    FileSelectionDialog.prototype.activate = function () {
        if (!this.initialized) {
            this.initialized = true;
            this.loadPage(1);
        }
    };

    FileSelectionDialog.prototype.loadPage = function (pageNumber) {
        var self = this,
            sc = self.searchControl;
        return system.defer(function (dfd) {
            self.isLoading(true);
            datacontext.searchFiles(sc.searchWords(), pageNumber, self.list.itemsPerPage(), sc.sortOptions.getOrderBy(), sc.currentFilter)
                .then(function (data) {
                    self.list.addPage(data, pageNumber);
                    dfd.resolve();
                })
                .fail(dfd.reject)
                .done(function () {
                    self.isLoading(false);
                });
        }).promise();
    };
    
    FileSelectionDialog.prototype.selectOk = function () {
        var selection = ko.utils.arrayMap(this.selectedFiles(), function (f) {
            return f.data();
        });
        if (!selection.length && this.selectedFile()) selection.push(this.selectedFile().data());

        dialog.close(this, {
            dialogResult: true,
            selectedFiles: selection
        });
    };

    FileSelectionDialog.prototype.selectCancel = function () {
        dialog.close(this, {
            dialogResult: false
        });
    };

    fileSelection.registerDialog(FileSelectionDialog);
    
    return FileSelectionDialog;
});