﻿/* 
 * draft/translator.js
 */
define([
    'durandal/app',
    '../module',
    'ko',
    'entityManagerProvider',
    'breeze',
    'Q',
    './translator/navigation',
    './translator/contentPartEditor',
    './translator/draftFiles',
    './translator/draftProperties',
    './editorModel',
    'infrastructure/websiteMetadata'
],
function (app, module, ko, entityManagerProvider, breeze, Q, Navigation, ContentPartEditor, DraftFiles, DraftProperties, EditorModel, WebsiteMetadata) {

    function Translator() {
        var self = this,
            manager = entityManagerProvider.createManager(),
            navigationVM,
            draftFilesVM,
            draftPropertiesVM,
            contentPartEditors = [],
            websiteMetadata = WebsiteMetadata.getSiteInfo();

        self.manager = manager;
        self.draftId = ko.observable();
        self.language = ko.observable();

        self.currentContent = ko.observable();
        self.currentNavigation = ko.observable();
        self.entity = ko.observable();
        self.entity.subscribe(onEntityChanged);
        self.files = ko.observableArray();

        self.activate = function (draftId, language) {
            self.draftId(draftId);
            self.language(new WebsiteMetadata.Language(language));

            var deferred = Q.defer();
            loadEntity(draftId)
                .then(function () {
                    initViews();
                    deferred.resolve();
                });
            return deferred.promise;
        };
        
        self.navigateBack = function () {
            self.showDraftsIndex();
        };

        self.showDraftsIndex = function () {
            module.routeConfig.hasUnsavedChanges(false);
            module.router.navigate(module.routeConfig.hash);
        };

        self.showFiles = function () {
            draftFilesVM = draftFilesVM || new DraftFiles(self);
            self.currentContent(draftFilesVM);
        };

        self.showProperties = function () {
            draftPropertiesVM = draftPropertiesVM || new DraftProperties(self);
            self.currentContent(draftPropertiesVM);
        };

        self.saveChanges = function () {
            self.entity().Modified().At(new Date());
            self.entity().Modified().By('me');
            manager.saveChanges().then(function () {
                app.trigger('caps:draft:saved', { entity: self.entity(), isNewDraft: false });
                self.showDraftsIndex();
            });
        };

        self.showContentPartEditor = function (contentPart) {
            var cpe = getOrCreateContentPartEditor(contentPart);
            if (cpe) self.currentContent(cpe);
        };

        self.fetchFile = function(id) {
            var query = breeze.EntityQuery.from('Files').where('Id', '==', id);
            return manager.executeQuery(query);
        };

        function loadEntity(id) {
            var query = breeze.EntityQuery.from('Drafts').where('Id', '==', id)
                .expand('Resources, ContentParts, ContentParts.Resources, Files, Files.Resources, Files.Resources.File');
            return manager.executeQuery(query).then(function (data) {
                self.entity(data.results[0]);
            });
        }

        function initViews() {
            navigationVM = navigationVM || new Navigation(self);
            self.currentNavigation(navigationVM);

            if (navigationVM.contentParts().length) {
                var first = navigationVM.contentParts()[0];
                var cpe = getOrCreateContentPartEditor(first.contentPart);
                if (cpe) self.currentContent(cpe);
            }
        }

        function getOrCreateContentPartEditor(contentPart) {
            var cpe = ko.utils.arrayFirst(contentPartEditors, function (item) {
                return item.contentPart === contentPart;
            });

            if (!cpe) {
                cpe = new ContentPartEditor(self, contentPart, self.language().culture);
                contentPartEditors.push(cpe);
            }

            return cpe;
        }

        function onEntityChanged() {
            var e = self.entity();
            if (e) {
                // Init Files.
                var fileTranslations = ko.utils.arrayMap(e.Files(), function (file) {
                    var originalResource = file.getResource('de'),
                        translationResource = file.getOrCreateResource(self.language().culture, manager);
                    return new DraftFileTranslation(self, item, originalResource, translationResource);
                });
                self.files(fileTranslations);

                // Init DraftResource
                var r = e.getOrCreateResource(self.language().culture, manager);
            }
        }
    }


    function DraftFileTranslation(editor, draftFile, originalResource, translationResource) {
        var self = this;
        self.draftFile = draftFile;
        self.original = originalResource;
        self.translation = translationResource;

        self.File = ko.computed(function () {
            if (self.translation && self.translation.File())
                return self.translation.File();
            return self.original.File();
        });

        self.selectFile = function () {
            app.selectFiles({
                module: module,
                title: 'Übersetzung für ' + originalResource.File().FileName() + ' wählen'
            }).then(function (result) {
                if (result.dialogResult) {
                    if (result.selectedFiles.length > 0) {
                        var file = result.selectedFiles[0];
                        setTranslatedFile(file);
                    }
                }
            });
        };

        self.resetFile = function () {
            self.translation.DbFileId(null);
        };

        function setTranslatedFile(file) {
            editor.fetchFile(file.Id()).then(function () {
                self.translation.DbFileId(file.Id());
            });
        }
    }

    return Translator;
});