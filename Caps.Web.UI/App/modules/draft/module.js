define(['infrastructure/moduleFactory', 'infrastructure/moduleRouter', './entities', 'ko', 'markdown'], function (moduleFactory, routerFactory, model, ko) {

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
                { route: 'create', moduleId: 'viewmodels/templateGallery', title: 'Vorlage', nav: false },
                { route: 'create/:templateName', moduleId: 'viewmodels/editor', title: 'Editor', nav: false },
                { route: 'edit/:draftId', moduleId: 'viewmodels/editor', title: 'Editor', nav: false }
            ])
            .buildNavigationModel();
    };
    

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

    var markdown = new Markdown.Converter();
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
            var htmlContent = markdown.makeHtml(value);
            $elem.html(htmlContent);
        }
    };

    return module;
});