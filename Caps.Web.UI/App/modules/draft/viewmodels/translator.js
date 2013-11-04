/* 
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
    './editorModel'
],
function (app, module, ko, entityManagerProvider, breeze, Q, Navigation, ContentPartEditor, DraftFiles, DraftProperties, EditorModel) {

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
            self.draftId(draftId);
            self.language(language);

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
        }

        function getOrCreateContentPartEditor(contentPart) {
            var cpe = ko.utils.arrayFirst(contentPartEditors, function (item) {
                return item.contentPart === contentPart;
            });

            if (!cpe) {
                cpe = new ContentPartEditor(self, contentPart, self.language());
                contentPartEditors.push(cpe);
            }

            return cpe;
        }

        function onEntityChanged() {
            var e = self.entity();
            if (e) {
                // Init Files.
                var localizedFiles = ko.utils.arrayMap(e.Files(), function (file) {
                    var resource = file.getOrCreateResource(self.language(), manager);
                    return new EditorModel.LocalizedDraftFile(file, resource);
                });
                self.files(localizedFiles);

                // Init DraftResource
                var r = e.getOrCreateResource(self.language(), manager);
            }
        }
    }

    return Translator;
});