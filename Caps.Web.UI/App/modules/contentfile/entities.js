define(['require', 'knockout'], function (require, ko) {

    var stringStartsWith = function (string, startsWith) {
        string = string || "";
        if (startsWith.length > string.length)
            return false;
        return string.substring(0, startsWith.length) === startsWith;
    };

    function DbFile() {
        var self = this;

        this.isImage = ko.computed({
            read: function () {
                return stringStartsWith(self.ContentType(), 'image');
            },
            deferEvaluation: true
        });

        this.latestVersion = ko.computed({
            read: function () {
                var versions = self.Versions();
                return versions.length > 0 ? versions[0] : null;
            },
            deferEvaluation: true
        });
    }

    return {
        DbFile: DbFile,
        extendModel: function (metadataStore) {
            metadataStore.registerEntityTypeCtor('DbFile', DbFile);
        }
    };

});