define([
    'ko',
    'entityManagerProvider',
    'plugins/router',
    'breeze',
    'durandal/app'
],
function (ko, entityManagerProvider, router, breeze, app) {

    var template = ko.observable(),
        manager = entityManagerProvider.createManager(),
        EntityQuery = breeze.EntityQuery;

    function createTemplate(websiteId) {
        var entity = manager.createEntity('DraftTemplate', { Name: 'Neue Vorlage', WebsiteId: websiteId });
        manager.addEntity(entity);

        template(entity);
    }

    function loadTemplate(id) {
        var query = new EntityQuery().from('DraftTemplates').where('Id', '==', id);
        return manager.executeQuery(query).then(function (data) {
            var t = data.results[0];
            template(t);
        });
    }

    return {
        activate: function (websiteId, id) {
            if (!id) createTemplate(websiteId);
            else loadTemplate(id);
        },

        template: template,

        navigateBack: function () {
            router.navigateBack();
        },

        saveChanges: function () {
            manager.saveChanges().then(router.navigateBack);
        },

        deleteTemplate: function () {
            var btnOk = 'Vorlage löschen',
                btnCancel = 'Abbrechen';

            app.showMessage('Soll die Vorlage wirklich gelöscht werden?', 'Vorlage löschen', [btnOk, btnCancel])
                .then(function (result) {
                    if (result === btnOk) {
                        template().entityAspect.setDeleted();
                        return manager.saveChanges().then(function () {
                            app.trigger('caps:draftTemplate:deleted', template().Id());
                            router.navigateBack();
                        });
                    }
                });
        },

        title: ko.computed(function () {
            return template() && template().Name().length ? template().Name() : 'Neue Vorlage';
        })
    };
});