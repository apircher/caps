define(['require', 'knockout', '../module', '../datacontext', 'Q', 'moment', 'infrastructure/utils', 'infrastructure/tagService'
], function (require, ko, module, datacontext, Q, moment, utils, tagService) {

    var app = require('durandal/app'),
        currentFileId = ko.observable(0),
        currentFile = ko.observable(),
        isLoading = ko.observable(false),
        tagName = ko.observable(),
        addTagUIVisible = ko.observable(false);

    var vm = {
        fileId: currentFileId,
        file: currentFile,

        isLoading: isLoading,

        activate: function (fileId) {
            currentFile(null);
            currentFileId(fileId);
            tagName(null);
            addTagUIVisible(false);
            return getFile()
                .fail(function (err) {
                    alert(err.message);
                });
        },

        refresh: function () {
            return getFile();
        },

        navigateBack: function () {
            module.router.navigate(module.routeConfig.hash);
        },

        previewTemplate: function (file) {
            if (file && file.isImage()) return 'file-preview-image';
            return 'file-preview-general';
        },

        addTagUIVisible: addTagUIVisible,
        tagNames: ko.computed(function () {
            return ko.utils.arrayMap(tagService.tags(), function (t) { return t.Name(); });
        }),

        tagName: tagName,

        addTag: function () {
            addTagUIVisible(true);
            var tn = tagName();
            if (tn && tn.length) {
                tagService.getOrCreateTag(tn)
                    .then(function (data) {
                        return datacontext.addFileTag(currentFile(), data);
                    })
                    .fail(function (err) {
                        window.alert(err.message || err.responseText);
                    })
                    .done(function () {
                        app.trigger('caps:tag:added', tagName());
                        tagName('');
                    });
            }
        },

        cancelAddTag: function () {
            tagName(null);
            addTagUIVisible(false);
        },

        updateTagName: function (element, e, datum, dataset) {
            tagName(datum.value);
        },

        removeTag: function (tag) {
            datacontext.removeFileTag(currentFile(), tag)
                .then(function (result) {
                    var deletedTags = ko.utils.arrayFilter(result.entities, function (entity) { return entity.entityType.shortName == 'Tag'; });
                    ko.utils.arrayForEach(deletedTags, function (tag) {
                        app.trigger('caps:tag:deleted', tag);
                    });
                })
                .fail(function () { alert(err.message || err.responseText); })
                .done(function () {
                    app.trigger('caps:tag:removed', tag);
                });
        },

        moment: moment,
        utils: utils
    };

    function getFile() {
        var deferred = Q.defer();
        isLoading(true);
        datacontext.fetchFile(currentFileId())
            .then(function () {
                currentFile(datacontext.localGetFile(currentFileId()));
                deferred.resolve(currentFile());
            })
            .fail(deferred.fail)
            .done(function () {
                isLoading(false);
            });
        return deferred.promise;
    }

    return vm;

});