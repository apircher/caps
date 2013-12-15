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

        entity.sortedVersions = ko.computed(function () {
            var versions = entity.Versions();
            versions.sort(function (a, b) {
                if (a.Id() == b.Id()) return 0;
                return a.Id() < b.Id() ? 1 : -1;
            });
            return versions;
        });

        entity.latestVersion = ko.computed(function () {
            var versions = entity.sortedVersions();
            return versions.length > 0 ? versions[0] : null;
        });

        entity.getVersion = function (versionId) {
            return ko.utils.arrayFirst(entity.Versions(), function (v) { return v.Id() == versionId; });
        };

        entity.nextVersion = function (fileVersion) {
            var versions = entity.sortedVersions(),
                index = versions.indexOf(fileVersion);
            if (index <= 0) return null;
            return versions[index - 1];
        };

        entity.previousVersion = function (fileVersion) {
            var versions = entity.sortedVersions(),
                index = versions.indexOf(fileVersion);
            if (index >= versions.length - 1) return null;
            return versions[index + 1];
        };
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