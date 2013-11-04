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
        title: 'Entwürfe',
        nav: 20,
        hash: '#drafts'
    });

    module.extendModel = model.extendModel;

    module.initializeRouter = function () {
        module.router = routerFactory.createModuleRouter(module, 'modules/draft', 'drafts')
            .map([
                { route: '', moduleId: 'viewmodels/index', title: 'Entwürfe', nav: false },
                { route: 'create', moduleId: 'viewmodels/templateGallery', title: 'Vorlage wählen', nav: false },
                { route: 'create/:templateName', moduleId: 'viewmodels/editor', title: 'Neuer Entwurf', nav: false },
                { route: 'edit/:draftId', moduleId: 'viewmodels/editor', title: 'Entwurf bearbeiten', nav: false },
                { route: 'translate/:draftId/:language', moduleId: 'viewmodels/translator', title: 'Übersetzung', nav: false }
            ])
            .buildNavigationModel();
    };
    
    app.on('caps:started', function () {
        require(['ko', 'markdown'], function (ko, markdown) {
            installKnockoutBindings(ko, markdown);
        });
    });
    
    function installKnockoutBindings(ko, markdown) {
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

        var converter = new Markdown.Converter();
        ko.bindingHandlers.markdown = {
            init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor()),
                    $elem = $(elem);
                ko.bindingHandlers.markdown.setText($elem, value);
            },
            update: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var value = ko.unwrap(valueAccessor()),
                    $elem = $(elem);
                ko.bindingHandlers.markdown.setText($elem, value);
            },
            setText: function ($elem, value) {
                var htmlContent = converter.makeHtml(value);
                $elem.html(htmlContent);
            }
        };
    }

    return module;
});