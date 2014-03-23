define([
    'durandal/system',
    'durandal/app',
    'knockout',
    '../module',
    '../datacontext',
    'moment',
    'infrastructure/utils',
    'infrastructure/tagService',
    'infrastructure/serverUtil',
    'durandal/composition',
    'moment',
    './uploadManager'
],
function (system, app, ko, module, datacontext, moment, utils, tagService, server, composition, moment, UploadManager) {

    var currentFileId = ko.observable(0),
        currentFile = ko.observable(),
        currentVersion = ko.observable(),
        versions = ko.observableArray(),
        isLoading = ko.observable(false),
        tagName = ko.observable(),
        addTagUIVisible = ko.observable(false),
        uploadManager = createUploadManager(),
        thumbnails = ko.observableArray();

    app.on('caps:sitemapnode:deleted', function (node) {
        var contentId = node.ContentId();
        datacontext.detachPublicationFileResources(contentId);
    });

    app.on('caps:draft:deleted', function (draft) {
        datacontext.detachDraftFileResources(draft);
    });

    app.on('caps:draft:saved', function (data) {
        if (data.deletedFiles && data.deletedFiles.length) {
            data.deletedFiles.forEach(function (f) {
                datacontext.detachDraftFile(f);
            });
        }
    });

    var $window = $(window);
    module.on('module:compositionComplete', function (m, instance) {
        if (instance === vm) $window.trigger('forceViewportHeight:refresh');
    });

    var vm = {
        fileId: currentFileId,
        file: currentFile,
        fileVersion: currentVersion,
        versions: versions,
        isLoading: isLoading,
        uploadManager: uploadManager,
        thumbnails: thumbnails,

        uploadedFromNowBy: ko.computed(function () {
            if (!currentVersion() || !currentVersion().entity) return '';
            return moment(currentVersion().entity.Modified().At()).fromNow() + ' von ' + currentVersion().entity.Modified().By();
        }),

        uploadedAt: ko.computed(function () {
            if (!currentVersion() || !currentVersion().entity) return '';
            return moment(currentVersion().entity.Modified().At()).format('LLLL');
        }),

        activate: function (fileId) {
            currentFile(null);
            currentFileId(fileId);
            tagName(null);
            addTagUIVisible(false);
            return getFile()
                .then(function () {
                    versions(ko.utils.arrayMap(currentFile().Versions(), function (v) {
                        return new fileVersionViewModel(v);
                    }));
                    currentVersion(versions()[0]);
                    refreshThumbnails(currentVersion().entity.Id());
                })
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

        previewTemplate: function (fileVersion) {
            if (fileVersion && fileVersion.File() && fileVersion.File().isImage()) return 'file-preview-image';
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

        deleteVersion: function (fileVersion) {
            app.showMessage('Soll die Version wirklich gelöscht werden?', 'Version löschen?', ['Ok', 'Abbrechen']).then(function (result) {
                if (result === 'Ok') {
                    datacontext.deleteFileVersion(fileVersion.entity).then(function () {
                        fileVersion.remove();
                        if (fileVersion.isCurrentVersion()) {
                            var cv = currentFile().nextVersion(fileVersion) || currentFile().previousVersion(fileVersion);
                            currentVersion(new fileVersionViewModel(cv));
                        }
                    });
                }
            });
        },

        deleteFile: function() {
            app.showMessage('Soll die Datei wirklich gelöscht werden?', 'Datei löschen?', ['Ok', 'Abbrechen']).then(function (result) {
                if (result === 'Ok') {
                    datacontext.deleteFile(currentFile()).then(function () {
                        app.trigger('caps:file:deleted', currentFile());
                        vm.navigateBack();
                    });
                }
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

    function fileVersionViewModel(entity) {
        var self = this;

        self.entity = entity;

        self.isCurrentVersion = ko.computed(function () {
            return currentVersion() && self.entity.Id() === currentVersion().entity.Id();
        });

        self.isInUse = ko.computed(function () {
            return self.entity.DraftFileResources().length > 0 || self.entity.PublicationFileResources().length > 0;
        });

        self.remove = function () {
            versions.remove(self);
        };

        self.select = function () {
            currentVersion(self);
        };

        self.navigateToResourceOwner = function (resource) {
            app.trigger('caps:contentfile:navigateToResourceOwner', resource);
        };
    }

    function thumbnailViewModel(data) {
        var self = this;

        self.name = ko.computed(function () {
            return data.name;
        });

        self.deleteThumbnail = function () {
            datacontext.deleteThumbnail(data.fileVersionId, data.id).then(function () {
                thumbnails.remove(self);
            });
        };
    }

    function createUploadManager() {
        return new UploadManager({
            uploadStarted: function (file, batchIndex, replace) {
                isLoading(true);
            },
            uploadDone: function (result, file) {
                isLoading(false);
                getFile().then(function() {
                    app.trigger('caps:contentfile:uploadDone', currentFile());
                });
            }
        });
    }

    function refreshThumbnails(fileVersionId) {
        thumbnails([]);
        datacontext.getThumbnailInfo(fileVersionId).then(function (data) {
            thumbnails(ko.utils.arrayMap(data, function(d) { return new thumbnailViewModel(d); }));
        });
    }

    return vm;

});