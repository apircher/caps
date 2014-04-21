/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a viewmodel for editing draft templates.
 */
define([
    'ko',
    'entityManagerProvider',
    'plugins/router',
    'breeze',
    'durandal/app'
],
function (ko, entityManagerProvider, router, breeze, app) {
    'use strict';

    var EntityQuery = breeze.EntityQuery;

    // Default content for new draft templates.
    var defaultTemplateContent = {
        'name': '',
        'rows': [
            {
                'cells': [
                    {
                        'name': '',
                        'title': '',
                        'colspan': 12,
                        'contentType': 'markdown',
                        'content': ''
                    }
                ]
            }
        ],
        'parameters': [
            {
                'name': '',
                'title': '',
                'type': 'String',
                'value': ''
            }
        ]
    };

    function TemplateEditorViewModel() {
        var self = this,
            manager = entityManagerProvider.createManager(),
            template = ko.observable();

        self.template = template;
        self.title = ko.computed(function () {
            var t = template();
            return t && t.Name().length ? t.Name() : 'Neue Vorlage';
        });

        /**
         * Activates the current TemplateEditorViewModel-Instance.
         */
        self.activate = function (websiteId, id) {
            if (!id) createTemplate(websiteId);
            else loadTemplate(id);
        };

        /**
         * Navigates to the previous view.
         */
        self.navigateBack = function () {
            router.navigateBack();
        };

        /**
         * Saves the changes and navigates back
         * to the previous view.
         */
        self.saveChanges = function () {
            manager.saveChanges().then(router.navigateBack);
        };

        /**
         * Deletes the current draft template and
         * navigates back to the previous view.
         */
        self.deleteTemplate = function () {
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
        };

        /**
         * Creates a new draft template in the local breeze context.
         */
        function createTemplate(websiteId) {
            var entity = manager.createEntity('DraftTemplate', {
                Name: 'Neue Vorlage',
                WebsiteId: websiteId,
                TemplateContent: JSON.stringify(defaultTemplateContent, null, 4)
            });
            manager.addEntity(entity);
            template(entity);
        }

        /**
         * Load the draft template with the given id into the local breeze context.
         */
        function loadTemplate(id) {
            var query = new EntityQuery().from('DraftTemplates').where('Id', '==', id);
            return manager.executeQuery(query).then(function (data) {
                var t = data.results[0];
                template(t);
            });
        }
    }

    return TemplateEditorViewModel;
});