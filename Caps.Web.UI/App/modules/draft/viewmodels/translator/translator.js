/* 
 * draft/translator.js
 */
define([
    'durandal/app',
    '../../module',
    'ko',
    'entityManagerProvider',
    'breeze',
    'Q',
    './navigation',
    './contentPartEditor',
    './draftFiles',
    './draftProperties',
    '../editor/editorModel',
    'localization'
],
function (app, module, ko, entityManagerProvider, breeze, Q, Navigation, ContentPartEditor, DraftFiles, DraftProperties, EditorModel, localization) {

    var $window = $(window);

    function Translator() {
        var self = this,
            manager = entityManagerProvider.createManager(),
            navigationVM,
            draftFilesVM,
            draftPropertiesVM,
            contentPartEditors = [];

        self.manager = manager;
        self.draftId = ko.observable();
        self.language = ko.observable();

        self.currentContent = ko.observable();
        self.currentNavigation = ko.observable();
        self.entity = ko.observable();
        self.entity.subscribe(onEntityChanged);
        self.files = ko.observableArray();

        self.activate = function (draftId, language) {
            module.on('module:compositionComplete', compositionComplete);

            self.draftId(draftId);
            self.language(new localization.Language(language));

            var deferred = Q.defer();
            loadEntity(draftId)
                .then(function () {
                    initViews();
                    deferred.resolve();
                });
            return deferred.promise;
        };

        self.deactivate = function () {
            module.off('module:compositionComplete', compositionComplete);
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
            var query = breeze.EntityQuery.from('Files').where('Id', '==', id).expand('Versions');
            return manager.executeQuery(query);
        };
        
        function compositionComplete(m, instance) {
            $window.trigger('forceViewportHeight:refresh');
        }

        function loadEntity(id) {
            var query = breeze.EntityQuery.from('Drafts').where('Id', '==', id)
                .expand('Translations, ContentParts.Resources, Files.Resources.FileVersion.File');
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

        function onEntityChanged(newValue) {
            if (newValue) {
                // Init Files.
                var fileTranslations = ko.utils.arrayMap(newValue.Files(), function (f) {
                    var originalResource = f.getResource('de'),
                        translationResource = f.getOrCreateResource(self.language().culture, manager);
                    return new DraftFileTranslation(self, f, originalResource, translationResource);
                });
                self.files(fileTranslations);

                // Init DraftTranslation
                var r = newValue.getOrCreateTranslation(self.language().culture, manager);
            }
        }
    }


    function DraftFileTranslation(editor, draftFile, originalResource, translationResource) {
        var self = this;
        self.draftFile = draftFile;
        self.original = originalResource;
        self.translation = translationResource;

        self.FileVersion = ko.computed(function () {
            if (self.translation && self.translation.FileVersion())
                return self.translation.FileVersion();
            return self.original.FileVersion();
        });

        self.selectFile = function () {
            app.selectFiles({
                module: module,
                title: 'Übersetzung für ' + originalResource.FileVersion().File().FileName() + ' wählen'
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
            self.translation.DbFileVersionId(null);
        };

        function setTranslatedFile(file) {
            editor.fetchFile(file.Id()).then(function (data) {
                var latestVersion = data.results[0].latestVersion();
                self.translation.DbFileVersionId(latestVersion.Id());
            });
        }
    }

    return Translator;
});