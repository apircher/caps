define(['require', 'knockout'], function (require, ko) {

    var dbFileProperties = {
        imageWidth: 'width',
        imageHeight: 'height'
    };

    var stringStartsWith = function (string, startsWith) {
        string = string || "";
        if (startsWith.length > string.length)
            return false;
        return string.substring(0, startsWith.length) === startsWith;
    };

    var findFileProperty = function (version, propertyName) {
        var prop = ko.utils.arrayFirst(version.Properties(), function (p) {
            return p.PropertyName() == propertyName;
        });
        return prop;
    };

    var propertyValueOrDefault = function (version, propertyName, defaultValue) {
        var prop = findFileProperty(version, propertyName);
        return prop ? prop.PropertyValue() : defaultValue;
    };

    /**
     * DbFile Entity
     */
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

    /**
     * DbFileVersion Entity
     */
    function DbFileVersion() {
        var self = this;

        this.imageWidth = ko.computed({
            read: function () {
                return propertyValueOrDefault(self, dbFileProperties.imageWidth, 0);                
            },
            deferEvaluation: true
        });

        this.imageHeight = ko.computed({
            read: function () {
                return propertyValueOrDefault(self, dbFileProperties.imageHeight, 0);
            },
            deferEvaluation: true
        });
    }


    return {
        DbFile: DbFile,
        DbFileVersion: DbFileVersion,
        extendModel: function (metadataStore) {
            metadataStore.registerEntityTypeCtor('DbFile', DbFile);
            metadataStore.registerEntityTypeCtor('DbFileVersion', DbFileVersion);
        }
    };

});