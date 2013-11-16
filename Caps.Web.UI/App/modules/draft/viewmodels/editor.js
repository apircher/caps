/*
 * draft/editor.js
 */
define([
    'durandal/app',
    'durandal/system',
    '../module',
    '../datacontext',
    'entityManagerProvider',
    'breeze',
    'ko',
    'Q',
    './editor/navigation',
    './editor/draftTemplate',
    './editor/draftProperties',
    './editor/draftFiles',
    './editor/contentPartEditor',
    './editor/templateEditor',
    './editorModel',
    'authentication'
],
function (app, system, module, datacontext, entityManagerProvider, breeze, ko, Q, Navigation, DraftTemplate, DraftProperties, DraftFiles, ContentPartEditor, TemplateEditor, EditorModel, authentication) {

    // Editor Model
    function DraftEditor() {
        var self = this,
            manager = entityManagerProvider.createManager(),
            navigationVM,
            draftTemplateVM,
            draftFilesVM,
            propertiesVM,
            templateEditorVM,
            contentPartEditors = [],
            router = module.router;

        self.currentContent = ko.observable();
        self.currentNavigation = ko.observable();
        self.entity = ko.observable();
        self.entity.subscribe(onEntityChanged);
        self.template = ko.observable();
        self.isNewDraft = ko.observable(false);

        self.activate = function (draftIdOrTemplateName) {
            return system.defer(function (dfd) {
                if (draftIdOrTemplateName && /^[0-9]+$/.test(draftIdOrTemplateName)) {
                    loadEntity(draftIdOrTemplateName)
                        .then(function () {
                            initViews();
                            dfd.resolve();
                        });
                }
                else {
                    self.isNewDraft(true);
                    createEntity(draftIdOrTemplateName);
                    initViews();
                    dfd.resolve();
                }
            })
            .promise();
        };

        self.shouldActivate = function (router, currentData, newData) {
            return currentData[0] !== newData[0];
        };

        self.showEditorMain = function () {
            draftTemplateVM = draftTemplateVM || new DraftTemplate(self);
            self.currentContent(draftTemplateVM);
        };

        self.showFiles = function () {
            draftFilesVM = draftFilesVM || new DraftFiles(self);
            self.currentContent(draftFilesVM);
        };

        self.showProperties = function () {
            propertiesVM = propertiesVM || new DraftProperties(self, self.entity().getOrCreateResource('de', manager));
            self.currentContent(propertiesVM);
        };

        self.showContentPartEditor = function (contentPart) {
            var cpe = findContentPartEditor(contentPart);
            if (cpe) self.currentContent(cpe);
        };

        self.showTemplateEditor = function () {
            templateEditorVM = templateEditorVM || new TemplateEditor(self);
            self.currentContent(templateEditorVM);
        };

        self.navigateBack = function () {
            if (self.currentContent() && (self.currentContent().name === 'ContentPartEditor' || self.currentContent().name === 'TemplateEditor')) {
                self.showEditorMain();
                return;
            }
            self.showDraftsIndex();
        };

        self.showDraftsIndex = function () {
            module.routeConfig.hasUnsavedChanges(false);
            module.router.navigate(module.routeConfig.hash);
        };

        self.saveChanges = function () {
            self.entity().Modified().At(new Date());
            self.entity().Modified().By(authentication.user().userName());
            manager.saveChanges().then(function () {
                app.trigger('caps:draft:saved', { entity: self.entity(), isNewDraft: self.isNewDraft() });
                self.showDraftsIndex();
            });
        };

        self.deleteDraft = function () {
            var btnOk = 'Entwurf löschen';
            var btnCancel = 'Abbrechen';
            app.showMessage('Soll der Entwurf wirklich gelöscht werden?', 'Entwurf löschen', [btnOk, btnCancel])
                .then(function (result) {
                    if (result === btnOk) deleteEntity();
                });
        };

        self.getOrCreateContentPart = function (partType) {
            var cp = self.entity().findContentPart(partType);
            if (!cp) {
                cp = manager.createEntity('DraftContentPart', {
                    DraftId: self.entity().Id(),
                    PartType: partType,
                    ContentType: 'markdown'
                });
                manager.addEntity(cp);

                var cpr = manager.createEntity('DraftContentPartResource', {
                    DraftContentPartId: self.entity().Id(),
                    Language: 'de',
                    Content: ''
                });
                manager.addEntity(cpr);
                
                cp.Resources.push(cpr);
                self.entity().ContentParts.push(cp);
            }
            return cp;
        };

        self.createDraftFile = function (file) {
            var query = breeze.EntityQuery.from('Files').where('Id', '==', file.Id()).expand('Versions.File');
            manager.executeQuery(query)
            .then(function (data) {
                var dbFile = data.results[0];

                var draftFile = manager.createEntity('DraftFile', { DraftId: self.entity().Id(), Name: file.FileName() });
                manager.addEntity(draftFile);

                var resource = manager.createEntity('DraftFileResource', { Language: 'de', DbFileVersionId: dbFile.latestVersion().Id() });
                manager.addEntity(resource);
                draftFile.Resources.push(resource);

                self.entity().Files.push(draftFile);
            });
        };

        function createEntity(templateName) {
            var template = datacontext.getTemplate(templateName);

            var d = manager.createEntity('Draft', { Template: templateName, Version: 1 });
            d.TemplateContent(JSON.stringify(template));
            d.Created().At(new Date());
            d.Created().By(authentication.user().userName());
            d.Modified().At(new Date());
            d.Modified().By(authentication.user().userName());

            var res = manager.createEntity('DraftResource', { Language: 'de' });
            d.Resources.push(res);

            self.entity(d);
        }

        function loadEntity(id) {
            var query = breeze.EntityQuery.from('Drafts').where('Id', '==', id)
                .expand('Resources, ContentParts.Resources, Files.Resources.FileVersion.File');
            return manager.executeQuery(query).then(function (data) {
                self.entity(data.results[0]);
            });
        }

        function deleteEntity() {
            self.entity().setDeleted();
            manager.saveChanges().then(self.navigateBack);
        }

        function initViews() {
            navigationVM = navigationVM || new Navigation(self);

            var qp = router.activeInstruction().queryParams;
            if (qp && qp.t) {
                if (qp.t === 'DraftProperties')
                    self.showProperties();
                else if (qp.t === 'DraftFiles')
                    self.showFiles();
                else {
                    var cp = self.entity().findContentPart(qp.t);
                    if (cp) self.showContentPartEditor(cp);
                }
            }

            if (!self.currentContent()) {
                draftTemplateVM = draftTemplateVM || new DraftTemplate(self);
                self.currentContent(draftTemplateVM);
            }
            
            self.currentNavigation(navigationVM);
        }
        
        function onEntityChanged() {
            var e = self.entity();
            if (e) {
                // Init Template.
                getTemplate();
                e.entityAspect.propertyChanged.subscribe(trackChanges);
            }
        }

        function getTemplate() {
            var e = self.entity();
            if (e) {
                self.template(e.deserializeTemplate());
            }
        }

        function trackChanges() {
            module.routeConfig.hasUnsavedChanges(manager.hasChanges());
        }

        function findContentPartEditor(contentPart) {
            var cpe = ko.utils.arrayFirst(contentPartEditors, function (item) {
                return item.contentPart === contentPart;
            });

            if (!cpe) {
                cpe = new ContentPartEditor(self, contentPart);
                contentPartEditors.push(cpe);
            }

            return cpe;
        }
    }
        
    return DraftEditor;
});