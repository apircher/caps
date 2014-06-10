define([
    'plugins/dialog',
    'ko'
],
function (dialog, ko) {

    function InsertLinkDialog() {
        var self = this;

        self.url = ko.observable('http://www.google.com').extend({ required: true });

        self.ok = function () {
            dialog.close(self, {
                result: true,
                url: self.url()
            });
        };

        self.cancel = function () {
            dialog.close(self, {
                result: false
            });
        };

        ko.validation.group(self);
    }

    return InsertLinkDialog;

});