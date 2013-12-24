/*
 * draft/module.js
 */
define([
    'infrastructure/moduleFactory',
    'infrastructure/moduleRouter',
    './entities',
    'durandal/app'
],
function (moduleFactory, routerFactory, model, app) {

    var module = moduleFactory.createModule({
        route: 'drafts*details',
        moduleId: 'modules/draft/module',
        title: 'Inhalte',
        nav: 20,
        hash: '#drafts'
    });

    module.extendModel = model.extendModel;

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/draft', 'drafts')
            .map([
                { route: '', moduleId: 'viewmodels/index', title: 'Inhalte', nav: false },
                { route: 'create', moduleId: 'viewmodels/templateGallery', title: 'Vorlage wählen', nav: false },
                { route: 'create/:templateName', moduleId: 'viewmodels/editor/editor', title: 'Neuer Inhalt', nav: false },
                { route: 'edit/:draftId', moduleId: 'viewmodels/editor/editor', title: 'Inhalt bearbeiten', nav: false },
                { route: 'translate/:draftId/:language', moduleId: 'viewmodels/translator/translator', title: 'Übersetzung', nav: false }
            ])
            .buildNavigationModel();
    };
    
    app.on('caps:started', function () {
        require(['ko', 'modules/draft/viewmodels/draftSelectionDialog'], function (ko, DraftSelectionDialog) {
            installKnockoutBindings(ko);
            DraftSelectionDialog.install();
        });
    });

    module.editDraft = function (draftId) {
        module.router.navigate('#drafts/edit/' + draftId);
    };
    app.registerContentEditor('Draft', module, module.editDraft);
    
    app.on('caps:contentfile:navigateToResourceOwner', function (resource) {
        if (resource.DraftFile) {
            module.router.navigate('#drafts/edit/' + resource.DraftFile().DraftId());
        }
    });
    
    function installKnockoutBindings(ko) {
        //
        // Custom knockout bindings
        //
        ko.bindingHandlers.draftTemplateClass = {
            init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor()),
                    $elem = $(elem);
                $elem.addClass('col-md-' + value.colspan);
            },
            update: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor());
                $(elem).addClass('col-md-' + value.colspan);
            }
        };
    }

    return module;
});