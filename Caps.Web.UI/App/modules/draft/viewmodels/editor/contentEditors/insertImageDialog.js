define([
    'durandal/app',
    'plugins/dialog'
],
function (app, dialog) {

    function InsertImageDialog(editor, draftEntity, selectedFile) {
        var self = this;

        self.draft = draftEntity;

        self.selectedFile = ko.observable();
        self.imageUrl = ko.observable();

        self.thumbnail = ko.observable(false);
        self.thumbnail.subscribe(refreshLink);

        self.thumbnailWidth = ko.observable(300);
        self.thumbnailWidth.subscribe(refreshLink);
        self.thumbnailHeight = ko.observable(300);
        self.thumbnailHeight.subscribe(refreshLink);

        self.files = ko.computed({
            read: function () {
                return ko.utils.arrayMap(draftEntity.Files(), createListItem);
            },
            deferEvaluation: true
        });

        self.selectFile = function (file) {
            self.selectedFile(file);
            refreshLink();
        };

        self.ok = function () {
            dialog.close(self, {
                result: true,
                url: self.imageUrl()
            });
        };

        self.cancel = function () {
            dialog.close(self, {
                result: false
            });
        };

        self.addFiles = function () {
            dialog.close(self, {
                result: false,
                addFiles: true
            });
        };

        function refreshLink() {
            if (self.selectedFile()) 
                self.imageUrl(buildUrl(self.selectedFile().fileName, self.thumbnail(), self.thumbnailWidth(), self.thumbnailHeight()));
            else 
                self.imageUrl('');
        }

        function buildUrl(fileName, thumbnail, width, height) {
            var url = 'caps://content-file/' + encodeURIComponent(fileName);
            if (thumbnail) url += '?size=' + (width || 0) + 'x' + (height || 0);
            return url;
        }

        function createListItem(data) {
            var resource = data.getResource('de'),
                fileName = resource.FileVersion().File().FileName();

            var item = {
                file: data,
                fileName: fileName,
                resource: resource,
                link: buildUrl(fileName)
            };

            item.isSelected = ko.computed(function () { return self.selectedFile() === item; });
            return item;
        }

        if (selectedFile) {
            var vm = ko.utils.arrayFirst(self.files(), function (f) { return f.file === selectedFile; });
            self.selectFile(vm);
        }
    }

    return InsertImageDialog;

});