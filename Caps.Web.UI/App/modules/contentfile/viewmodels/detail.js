define([
    'durandal/system',
    'durandal/app',
    'knockout',
    '../module',
    '../datacontext',
    'moment',
    'infrastructure/utils',
    'infrastructure/tagService',
    'infrastructure/serverUtil'
],
function (system, app, ko, module, datacontext, moment, utils, tagService, server) {

    var currentFileId = ko.observable(0),
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
        utils: utils,
        server: server
    };

    function getFile() {
        return system.defer(function (dfd) {
            isLoading(true);
            datacontext.fetchFile(currentFileId()).then(function () {
                currentFile(datacontext.localGetFile(currentFileId()));
                dfd.resolve(currentFile());
            })
            .fail(dfd.fail)
            .done(function () {
                isLoading(false);
            });
        })
        .promise();
    }

    return vm;

});