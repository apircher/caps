/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

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
    'use strict';
    
    /**
     * ContentFileDetailViewModel class
     */
    function ContentFileDetailViewModel() {
        var self = this,
            currentFileId = ko.observable(0),
            currentFile = ko.observable(),
            currentVersion = ko.observable(),
            versions = ko.observableArray(),
            isLoading = ko.observable(false),
            tagName = ko.observable(),
            addTagUIVisible = ko.observable(false),
            uploadManager = app.uploadManager,
            thumbnails = ko.observableArray();

        self.fileId = currentFileId;
        self.file = currentFile;
        self.fileVersion = currentVersion;
        self.versions = versions;
        self.isLoading = isLoading;
        self.uploadManager = uploadManager;
        self.thumbnails = thumbnails;
        self.addTagUIVisible = addTagUIVisible;
        self.tagName = tagName;
        self.moment = moment;
        self.utils = utils;
        self.server = server;

        self.activate = function (fileId) {
            currentFile(null);
            currentFileId(fileId);
            tagName(null);
            addTagUIVisible(false);

            app.on('uploadManager:uploadStarted', uploadManager_uploadStarted);
            app.on('uploadManager:uploadDone', uploadManager_uploadDone);

            return getFile()
                .then(function () {
                    refreshVersions();
                    refreshThumbnails(currentVersion().entity.Id());
                })
                .fail(function (err) {
                    alert(err.message);
                });
        };

        self.deactivate = function () {
            app.off('uploadManager:uploadStarted', uploadManager_uploadStarted);
            app.off('uploadManager:uploadDone', uploadManager_uploadDone);
        };

        self.uploadedFromNowBy = ko.computed(function () {
            if (!currentVersion() || !currentVersion().entity) return '';
            return moment(currentVersion().entity.Modified().At()).fromNow() + ' von ' + currentVersion().entity.Modified().By();
        });

        self.uploadedAt = ko.computed(function () {
            if (!currentVersion() || !currentVersion().entity) return '';
            return moment(currentVersion().entity.Modified().At()).format('LLLL');
        });

        self.refresh = function () {
            return getFile();
        };

        self.navigateBack = function () {
            module.router.navigate(module.routeConfig.hash);
        };

        self.previewTemplate = function (fileVersion) {
            if (fileVersion && fileVersion.File() && fileVersion.File().isImage()) return 'file-preview-image';
            return 'file-preview-general';
        };

        self.tagNames = ko.computed(function () {
            return ko.utils.arrayMap(tagService.tags(), function (t) { return t.Name(); });
        });

        self.addTag = function () {
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
        };

        self.cancelAddTag = function () {
            tagName(null);
            addTagUIVisible(false);
        };

        self.updateTagName = function (element, e, datum, dataset) {
            tagName(datum.value);
        };

        self.removeTag = function (tag) {
            datacontext.removeFileTag(currentFile(), tag)
                .then(function (result) {
                    var deletedTags = ko.utils.arrayFilter(result.entities, function (entity) { return entity.entityType.shortName == 'Tag'; });
                    ko.utils.arrayForEach(deletedTags, function (t) {
                        app.trigger('caps:tag:deleted', t);
                    });
                })
                .fail(function () { alert(err.message || err.responseText); })
                .done(function () {
                    app.trigger('caps:tag:removed', tag);
                });
        };

        self.deleteVersion = function (fileVersion) {
            app.showMessage('Soll die Version wirklich gelöscht werden?', 'Version löschen?', ['Ok', 'Abbrechen']).then(function (result) {
                if (result === 'Ok') {
                    datacontext.deleteFileVersion(fileVersion.entity).then(function () {
                        fileVersion.remove();
                        if (fileVersion.isCurrentVersion()) {
                            var cv = currentFile().nextVersion(fileVersion) || currentFile().previousVersion(fileVersion);
                            currentVersion(new FileVersionViewModel(cv));
                        }
                    });
                }
            });
        };

        self.deleteFile = function () {
            app.showMessage('Soll die Datei wirklich gelöscht werden?', 'Datei löschen?', ['Ok', 'Abbrechen']).then(function (result) {
                if (result === 'Ok') {
                    datacontext.deleteFile(currentFile()).then(function () {
                        app.trigger('caps:file:deleted', currentFile());
                        self.navigateBack();
                    });
                }
            });
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

        function refreshVersions() {
            versions(ko.utils.arrayMap(currentFile().Versions(), function (v) {
                return new FileVersionViewModel(v);
            }));
            currentVersion(versions()[0]);
        }
        
        function uploadManager_uploadStarted(file, batchIndex, storageOptions) {
            isLoading(true);
        }

        function uploadManager_uploadDone(file, result) {
            isLoading(false);
            datacontext.detachContentFile(currentFile());
            getFile().then(function () {
                refreshVersions();
                app.trigger('caps:contentfile:replaced', currentFile());
            });
        }

        function refreshThumbnails(fileVersionId) {
            thumbnails([]);
            datacontext.getThumbnailInfo(fileVersionId).then(function (data) {
                thumbnails(ko.utils.arrayMap(data, function (d) { return new ThumbnailViewModel(d); }));
            });
        }
        

        /**
         * FileVersionViewModel class
         */
        function FileVersionViewModel(entity) {
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

        /**
         * ThumbnailViewModel class
         */
        function ThumbnailViewModel(data) {
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
    }

    return ContentFileDetailViewModel;

});