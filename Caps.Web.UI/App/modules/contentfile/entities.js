define([
    'require',
    'knockout',
    'infrastructure/utils'
],
function (require, ko, utils) {

    /*
     * DbFile Entity
     */
    function DbFile() {

    }

    function initializeDbFile(entity) {
        entity.isImage = ko.computed(function () {
            return utils.stringStartsWith(entity.ContentType(), 'image');
        });

        entity.latestVersion = ko.computed(function () {
            var versions = entity.Versions();
            return versions.length > 0 ? versions[0] : null;
        });
    }

    /*
     * DbFileVersion Entity
     */
    function DbFileVersion() {

    }

    function initializeDbFileVersion(entity) {
        entity.imageWidth = ko.computed(function () {
            return propertyValueOrDefault(entity, dbFileProperties.imageWidth, 0);
        });

        entity.imageHeight = ko.computed(function () {
            return propertyValueOrDefault(entity, dbFileProperties.imageHeight, 0);
        });
    }


    var dbFileProperties = {
        imageWidth: 'width',
        imageHeight: 'height'
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


    return {
        DbFile: DbFile,
        DbFileVersion: DbFileVersion,
        extendModel: function (metadataStore) {
            metadataStore.registerEntityTypeCtor('DbFile', DbFile, initializeDbFile);
            metadataStore.registerEntityTypeCtor('DbFileVersion', DbFileVersion, initializeDbFileVersion);
        }
    };

});