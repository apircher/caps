define(['../module', '../datacontext', 'ko', 'Q', 'modules/draft/viewmodels/editor/navigation', 'modules/draft/viewmodels/editor/draftTemplate', 'modules/draft/viewmodels/editor/draftProperties', 'modules/draft/viewmodels/editor/draftFiles', 'modules/draft/viewmodels/editor/contentPartEditor',
    'entityManagerProvider', 'breeze', 'durandal/app', 'durandal/system'
], function (module, datacontext, ko, Q, Navigation, DraftTemplate, DraftProperties, DraftFiles, ContentPartEditor, entityManagerProvider, breeze, app, system) {

    // Editor Model
    function DraftEditor() {
        var self = this,
            manager = entityManagerProvider.createManager(),
            navigationVM,
            draftTemplateVM,
            draftFilesVM,
            propertiesVM,
            contentPartEditors = [],
            router = module.router;

        self.currentContent = ko.observable();
        self.currentNavigation = ko.observable();
        self.entity = ko.observable();
        self.entity.subscribe(onEntityChanged);
        self.template = ko.observable();

        self.activate = function (draftIdOrTemplateName) {
            var deferred = Q.defer();
            if (draftIdOrTemplateName && /^[0-9]+$/.test(draftIdOrTemplateName)) {
                loadEntity(draftIdOrTemplateName)
                    .then(function () {
                        initViews();
                        deferred.resolve();
                    });
            }
            else {
                createEntity(draftIdOrTemplateName);
                initViews();
                deferred.resolve();
            }
            return deferred.promise;
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
            propertiesVM = propertiesVM || new DraftProperties(self);
            self.currentContent(propertiesVM);
        };

        self.showContentPartEditor = function (contentPart) {
            var cpe = findContentPartEditor(contentPart);
            if (cpe) self.currentContent(cpe);
        };

        self.navigateBack = function () {
            if (self.currentContent() && self.currentContent().name === 'ContentPartEditor') {
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
            self.entity().Modified().By('me');
            manager.saveChanges().then(function () {
                app.trigger('caps:draft:saved', self.entity());
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
            var df = manager.createEntity('DraftFile', { DraftId: this.entity().Id(), Name: file.FileName() });
            manager.addEntity(df);

            var res = manager.createEntity('DraftFileResource', { Language: 'de', DbFileId: file.Id() });
            manager.addEntity(res);

            df.Resources.push(res);
            self.entity().Files.push(df);
        };

        function createEntity(templateName) {
            var template = datacontext.getTemplate(templateName);

            var d = manager.createEntity('Draft', { Name: 'Entwurf', Template: templateName });
            d.TemplateContent(JSON.stringify(template));

            var res = manager.createEntity('DraftResource', { Language: 'de', Title: 'Neuer Entwurf' });
            d.Resources.push(res);

            self.entity(d);
        }

        function loadEntity(id) {
            var query = breeze.EntityQuery.from('Drafts').where('Id', '==', id)
                .expand('Resources, ContentParts, ContentParts.Resources, Files, Files.Resources');
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