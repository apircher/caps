define([
    'plugins/dialog'
],
function (dialog) {

    function InsertLinkDialog() {
        var self = this;

        self.ok = function () {
            dialog.close(self, {
                result: true,
                url: 'http://www.xyz.de'
            });
        };

        self.cancel = function () {
            dialog.close(self, {
                result: false
            });
        };
    }

    return InsertLinkDialog;

});