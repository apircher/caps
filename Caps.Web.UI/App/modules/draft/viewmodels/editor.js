define(['../module', 'ko', 'Q', 'modules/draft/viewmodels/editor/navigation', 'modules/draft/viewmodels/editor/draftTemplate', 'modules/draft/viewmodels/editor/draftProperties',
    'entityManagerProvider', 'breeze', 'durandal/app'
], function (module, ko, Q, Navigation, DraftTemplate, DraftProperties, entityManagerProvider, breeze, app) {

    // Editor Model
    function DraftEditor() {
        var self = this,
            manager = entityManagerProvider.createManager(),
            navigationVM,
            draftTemplateVM,
            propertiesVM;

        self.currentContent = ko.observable();
        self.currentNavigation = ko.observable();
        self.entity = ko.observable();

        self.activate = function (draftId) {
            var deferred = Q.defer();
            if (draftId) {
                loadEntity(draftId)
                    .then(function () {
                        initViews();
                        deferred.resolve();
                    });
            }
            else {
                createEntity();
                initViews();
                deferred.resolve();
            }
            return deferred.promise;
        };

        self.shouldActivate = function (router, currentData, newData) {
            if (currentData[0] === newData[0]) {
                module.router.attached();
                return false;
            }
            return true;
        };

        self.showEditorMain = function () {
            draftTemplateVM = draftTemplateVM || new DraftTemplate(self);
            self.currentContent(draftTemplateVM);
        };

        self.showProperties = function () {
            propertiesVM = propertiesVM || new DraftProperties(self);
            self.currentContent(propertiesVM);
        };

        self.navigateBack = function () {
            module.router.navigate(module.routeConfig.hash);
        };

        self.saveChanges = function () {
            manager.saveChanges().then(self.navigateBack);
        };

        self.deleteDraft = function () {
            var btnOk = 'Entwurf löschen';
            var btnCancel = 'Abbrechen';
            app.showMessage('Soll der Entwurf wirklich gelöscht werden?', 'Entwurf löschen', [btnOk, btnCancel])
                .then(function (result) {
                    if (result === btnOk) deleteEntity();
                });
        };

        function createEntity() {
            self.entity(manager.createEntity('Draft', { Name: 'Entwurf', Template: 'default' }));
        }

        function loadEntity(id) {
            var query = breeze.EntityQuery.from('Drafts').where('Id', '==', id);
            return manager.executeQuery(query).then(function (data) {
                self.entity(data.results[0]);
            });
        }

        function deleteEntity() {
            self.entity().entityAspect.setDeleted();
            manager.saveChanges().then(self.navigateBack);
        }

        function initViews() {
            navigationVM = navigationVM || new Navigation(self);
            draftTemplateVM = draftTemplateVM || new DraftTemplate(self);

            self.currentContent(draftTemplateVM);
            self.currentNavigation(navigationVM);
        }
    }
    
    return DraftEditor;
});