/*
 * draft/editor.js
 */
define([
    'durandal/app',
    'durandal/system',
    '../../module',
    '../../datacontext',
    '../../entities',
    'entityManagerProvider',
    'breeze',
    'ko',
    'Q',
    './navigation',
    './draftTemplate',
    './draftProperties',
    './draftFiles',
    './contentPartEditor',
    './templateEditor',
    './draftNotes',
    './editorModel',
    'authentication'
],
function (app, system, module, datacontext, DraftsModel, entityManagerProvider, breeze, ko, Q, Navigation, DraftTemplate, DraftProperties, DraftFiles, ContentPartEditor, TemplateEditor, DraftNotesEditor, EditorModel, authentication) {
    
    // Editor Model
    function DraftEditor() {
        var self = this,
            manager = entityManagerProvider.createManager(),
            navigationVM,
            draftTemplateVM,
            draftFilesVM,
            propertiesVM,
            templateEditorVM,
            draftNotesVM,
            contentPartEditors = [],
            router = module.router,
            hasErrors = ko.observable();

        self.currentContent = ko.observable();
        self.currentNavigation = ko.observable();
        self.entity = ko.observable();
        self.template = ko.computed(function () { return self.entity() ? self.entity().template() : undefined; });
        self.isNewDraft = ko.observable(false);
        self.draftStates = DraftsModel.supportedDraftStates;
        self.lastContentPart = ko.observable();

        manager.hasChangesChanged.subscribe(function (args) {
            module.routeConfig.hasUnsavedChanges(args.hasChanges);
        });

        manager.validationErrorsChanged.subscribe(function (args) {
            var entity = args.entity;
            hasErrors(entity.hasValidationErrors.call(entity));
        });

        self.activate = function (draftIdOrTemplateName, queryString) {
            app.on('caps:contentfile:replaced', fileUploadDone);
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
                    createEntity(draftIdOrTemplateName, queryString);
                    initViews();
                    dfd.resolve();
                }
            })
            .promise();
        };

        self.canDeactivate = function () {
            if (!manager.hasChanges()) return true;
            return system.defer(function (dfd) {
                var btnYes = 'Speichern', btnNo = 'Verwerfen', btnCancel = 'Abbrechen';
                app.showMessage('Sollen die Änderungen gespeichert werden?', 'Änderungen speichern?', [btnYes, btnNo, btnCancel]).then(function (dialogResult) {
                    if (dialogResult === btnCancel) 
                        dfd.resolve(false);
                    else if (dialogResult === btnYes) {
                        var resultOrPromise = self.saveChanges();
                        if (resultOrPromise && resultOrPromise.then)
                            resultOrPromise.then(function () { dfd.resolve(true); });
                        else
                            dfd.resolve(false);
                    }
                    else
                        dfd.resolve(true);
                });
            })
            .promise();
        };

        self.deactivate = function () {
            module.routeConfig.hasUnsavedChanges(false);
            app.off('caps:contentfile:replaced', fileUploadDone);
            if (draftFilesVM) draftFilesVM.deactivate();
        };

        self.shouldActivate = function (router, currentData, newData) {
            return currentData[0] !== newData[0];
        };

        self.showEditorMain = function () {
            draftTemplateVM = draftTemplateVM || new DraftTemplate(self);
            self.currentContent(draftTemplateVM);
            self.lastContentPart(null);
        };

        self.showLayoutArea = function () {
            if (self.lastContentPart())
                self.showContentPartEditor(self.lastContentPart());
            else
                self.showEditorMain();
        };

        self.showFiles = function () {
            draftFilesVM = draftFilesVM || new DraftFiles(self);
            var template = self.template();
            if (template && template.fileGroups && system.isArray(template.fileGroups)) {
                draftFilesVM.ensureGroupsExist(template.fileGroups);
            }
            self.currentContent(draftFilesVM);
        };

        self.showProperties = function () {
            propertiesVM = propertiesVM || new DraftProperties(self);
            self.currentContent(propertiesVM);
        };

        self.showContentPartEditor = function (contentPart) {
            var cpe = findContentPartEditor(contentPart);
            if (cpe) {
                cpe.showPreview(false);
                self.currentContent(cpe);
                self.lastContentPart(contentPart);
            }
        };

        self.showTemplateEditor = function () {
            templateEditorVM = templateEditorVM || new TemplateEditor(self);
            self.currentContent(templateEditorVM);
        };

        self.showDraftNotes = function () {
            draftNotesVM = draftNotesVM || new DraftNotesEditor(self);
            self.currentContent(draftNotesVM);
        };

        self.navigateBack = function () {
            self.showDraftsIndex();
        };

        self.showDraftsIndex = function () {
            module.router.navigate(module.routeConfig.hash);
        };

        self.saveChangesAndNavigateBack = function () {
            self.saveChanges().then(self.navigateBack);
        };

        self.saveChanges = function () {
            if (hasErrors()) {
                app.showMessage('Der Inhalt kann noch nicht gespeichert werden. Prüfe die markierten Felder und ergänze oder korrigiere die Eingaben.', 'Noch nicht komplett', ['Ok']);
                return false;
            }

            self.entity().Modified().At(new Date());
            self.entity().Modified().By(authentication.user().userName());

            var deletedDraftFiles = manager.getEntities('DraftFile', breeze.EntityState.Deleted);
            return manager.saveChanges().then(function () {
                app.trigger('caps:draft:saved', { entity: self.entity(), isNewDraft: self.isNewDraft(), deletedFiles: deletedDraftFiles });
                module.routeConfig.hasUnsavedChanges(false);
            });
        };

        self.deleteDraft = function () {
            var btnOk = 'Entwurf löschen';
            var btnCancel = 'Abbrechen';
            app.showMessage('Soll der Entwurf wirklich gelöscht werden?', 'Entwurf löschen', [btnOk, btnCancel])
                .then(function (result) {
                    if (result === btnOk) {
                        if (self.isNewDraft()) {
                            manager.rejectChanges();
                            self.navigateBack();
                            return;
                        }
                        deleteEntity();
                    }
                });
        };

        self.getOrCreateContentPart = function (templateCell) {
            var cp = self.entity().findContentPart(templateCell.name);
            if (!cp) {
                cp = manager.createEntity('DraftContentPart', {
                    DraftId: self.entity().Id(),
                    Name: templateCell.name,
                    ContentType: templateCell.contentType || 'markdown'
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

        self.createDraftFile = function (file, groupName, ranking) {
            var query = breeze.EntityQuery.from('Files').where('Id', '==', file.Id()).expand('Versions.File');
            return manager.executeQuery(query).then(function (data) {
                var dbFile = data.results[0];

                var draftFile = manager.createEntity('DraftFile', { Name: file.FileName() });
                if (file.isImage()) draftFile.Determination('Picture');
                if (groupName && groupName.length) draftFile.Group(groupName);
                manager.addEntity(draftFile);

                var resource = manager.createEntity('DraftFileResource', { Language: 'de', DbFileVersionId: dbFile.latestVersion().Id() });
                manager.addEntity(resource);
                draftFile.Resources.push(resource);

                draftFile.DraftId(self.entity().Id());
                draftFile.Ranking(ranking);

                self.entity().Files.push(draftFile);
                return draftFile;
            });
        };

        function fileUploadDone(file) {
            var fileId = file.Id(),
                draftFiles = ko.utils.arrayFilter(self.entity().Files(), function (f) {
                    var res = ko.utils.arrayFirst(f.Resources(), function (r) {
                        return r.FileVersion() && r.FileVersion().FileId() === fileId;
                    });
                    return res !== null;
                });

            if (draftFiles.length) {
                var query = breeze.EntityQuery.from('Files').where('Id', '==', fileId).expand('Versions.File');
                return manager.executeQuery(query);
            }
        }

        function createEntity(templateName, queryString, language) {
            language = language || 'de';
            datacontext.getTemplate(templateName).then(function (t) {
                var template = t,
                    d = manager.createEntity('Draft', { TemplateName: templateName, Version: 1, OriginalLanguage: language, Status: 'NEW' });
                d.Template(JSON.stringify(template));
                d.Created().At(new Date());
                d.Created().By(authentication.user().userName());
                d.Modified().At(new Date());
                d.Modified().By(authentication.user().userName());

                if (queryString && queryString.name)
                    d.Name(queryString.name);

                self.entity(d);

                template.forEachCell(function (row, cell, ranking) {
                    var contentPart = self.getOrCreateContentPart(cell);
                    contentPart.Ranking(ranking);
                    if (cell.content) {
                        var regexPlaceHolders = /<%\s*([A-Za-z0-9_\.]+)\s*%>/gi;
                        var content = cell.content.replace(regexPlaceHolders, function (hit, p1) {
                            if (queryString && queryString[p1]) return queryString[p1];
                            return findTemplateParameterValue(p1) || 'Nicht gefunden';
                        });
                        contentPart.getResource('de').Content(content);
                    }
                });
            });
        }

        function findTemplateParameterValue(key) {
            if (!self.entity() || !self.entity().template())
                return null;

            var template = self.entity().template();
            if (!template.parameters)
                return null;

            var p = ko.utils.arrayFirst(template.parameters, function (pa) {
                return pa.name.toLowerCase() === key.toLowerCase();
            });

            if (!p) return null;
            return p.value;
        }

        function loadEntity(id) {
            var query = breeze.EntityQuery.from('Drafts').where('Id', '==', id)
                .expand('ContentParts.Resources, Files.Resources.FileVersion.File');
            return manager.executeQuery(query).then(function (data) {
                self.entity(data.results[0]);
            });
        }

        function deleteEntity() {
            self.entity().setDeleted();
            manager.saveChanges().then(function () {
                app.trigger('caps:draft:deleted', self.entity());
                self.navigateBack();
            });
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