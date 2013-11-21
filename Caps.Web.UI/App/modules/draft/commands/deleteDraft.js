define([
    'durandal/system',
    'durandal/app',
    'entityManagerProvider',
    'breeze',
    'ko'
],
function (system, app, entityManagerProvider, breeze, ko) {

    var EntityQuery = breeze.EntityQuery;

    function DeleteDraftCommand() {
        var self = this;
        self.manager = entityManagerProvider.createManager();
        self.isExecuting = ko.observable(false);
    }

    DeleteDraftCommand.prototype.canExecute = function (draftId) {
        return !this.isExecuting();
    };

    DeleteDraftCommand.prototype.execute = function (draftId) {
        var self = this;
        if (!self.canExecute(draftId)) return;        
        self.isExecuting(true);
        return self.deleteDraft(draftId).then(function () {
            self.isExecuting(false);
        });
        
    };

    DeleteDraftCommand.prototype.deleteDraft = function (draftId) {
        var self = this;
        return system.defer(function (dfd) {            
            // Load the draft.
            var query = new EntityQuery().from('Drafts').where('Id', '==', draftId)
                .expand('Translations, ContentParts.Resources, Files.Resources.FileVersion.File');

            self.manager.executeQuery(query).then(function (data) {
                var btnOk = 'Entwurf löschen',
                    btnCancel = 'Abbrechen',
                    draft = data.results[0];
                app.showMessage('Soll der Entwurf "' + draft.Name() + '" wirklich gelöscht werden?', 'Entwurf löschen', [btnOk, btnCancel])
                    .then(function (result) {
                        if (result === btnOk) {
                            draft.setDeleted();
                            return self.manager.saveChanges().then(function () {
                                app.trigger('caps:draft:deleted', draftId);
                            })
                            .then(dfd.resolve).fail(dfd.reject);
                        }
                        else
                            dfd.resolve();
                    });
            })
            .fail(dfd.reject);
        })
        .promise();
    };

    return DeleteDraftCommand;
});