
define(['knockout', 'jquery', 'bootstrap'], function (ko, $) {
    
    //
    // Bootstrap Popover Binding.
    //
    ko.bindingHandlers.popover = {
        init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = valueAccessor() || {};
            $(elem).popover(options);
        },
        update: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = valueAccessor() || {},
                $elem = $(elem);
            $elem.popover('destroy');
            $elem.popover(options);
        }
    };

    //
    // Editor Templates
    //
    ko.bindingHandlers.composeEditor = {
        prepareOptions: function (valueAccessor) {
            var options = valueAccessor() || {},
                type = options.type || 'input',
                css = {};

            css.autofocus = options.autofocus || false;
            if (options.css != undefined && typeof options.css === 'string') {
                if (options.css.length > 0) css[options.css] = true;
            }

            options.view = 'views/editorTemplates/' + type + 'Template';
            options.model = {
                field: options.field,
                title: options.title || '',
                valueUpdate: options.valueUpdate || '',
                popoverContainer: options.popoverContainer || '',
                popoverPlacement: options.popoverPlacement || 'right',
                popoverTrigger: options.popoverTrigger || 'focus',
                css: css
            };
            return options;
        },
        init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.bindingHandlers.compose.init(elem, function () { return ko.bindingHandlers.composeEditor.prepareOptions(valueAccessor); }, allBindingsAccessor, viewModel, bindingContext);
        },
        update: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var self = this;
            ko.bindingHandlers.compose.update(elem, function () { return ko.bindingHandlers.composeEditor.prepareOptions(valueAccessor); }, allBindingsAccessor, viewModel, bindingContext);
        }
    };
    ko.virtualElements.allowedBindings.composeEditor = true;
    
    //
    // Unique Ids for Dom-Elements.
    // Based on http://stackoverflow.com/questions/9233176/unique-ids-in-knockout-js-templates
    // 
    var UniqueIdNamespace = function (prefix) {
        var counter = 0;
        this.nextId = function () {
            return prefix + (++counter);
        };
    };

    var UniqueIdCollection = function (observable) {
        var self = this;
        self.getId = function (prefix, provider) {
            provider = provider || ko.bindingHandlers.uniqueId.provider;
            return provider.getUniqueId(prefix || ko.bindingHandlers.uniqueId.prefix, observable);
        };
        self.getSelector = function (prefix) {
            return '#' + self.getId(prefix);
        };
    };

    var UniqueIdProvider = function () {
        var self = this, namespaces = {};

        self.getUniqueId = function (prefix, observable) {
            observable.uniqueIds = observable.uniqueIds || new UniqueIdCollection(observable);
            return observable.uniqueIds[prefix] || nextId(prefix, observable);
        };

        function ensureNamespace(prefix) {
            namespaces[prefix] = namespaces[prefix] || new UniqueIdNamespace(prefix);
            return namespaces[prefix];
        }

        function nextId(prefix, observable) {
            observable.uniqueIds = observable.uniqueIds || new UniqueIdCollection(observable);
            var uniqueIds = observable.uniqueIds;
            uniqueIds[prefix] = uniqueIds[prefix] || ensureNamespace(prefix).nextId();
            return uniqueIds[prefix];
        }
    };

    ko.bindingHandlers.uniqueId = {
        provider: new UniqueIdProvider(),
        prefix: "__unique",
        init: function (element, valueAccessor, allBindingsAccessor) {
            var valueBinding = allBindingsAccessor().value,
                value = valueBinding,
                prefix = ko.bindingHandlers.uniqueId.prefix,
                prefixOrOptions = valueAccessor(),
                provider = ko.bindingHandlers.uniqueId.provider;

            if (prefixOrOptions) {
                if (typeof prefixOrOptions === 'string')
                    prefix = prefixOrOptions;
                else if (typeof prefixOrOptions === 'object') {
                    prefix = prefixOrOptions.prefix;
                    value = prefixOrOptions.value || value;
                }
            }
            if (!value) 
                throw new Error('No value provided. Add a value-Binding to the Element or provide a value in the options of the uniqueId-Binding.');

            element.id = provider.getUniqueId(prefix, value);
        }
    };

    ko.bindingHandlers.uniqueFor = {
        init: function (element, valueAccessor) {
            var prefix = ko.bindingHandlers.uniqueId.prefix,
                valueOrOptions = valueAccessor(),
                provider = ko.bindingHandlers.uniqueId.provider,
                value;

            if (ko.isObservable(valueOrOptions)) 
                value = valueOrOptions;
            else if (typeof valueOrOptions === 'object') {
                value = valueOrOptions.value;
                prefix = valueOrOptions.prefix || prefix;
            }
            if (!value) 
                throw new Error('No value provided. Provide a value in the options of the uniqueFor-Binding.');

            element.setAttribute("for", provider.getUniqueId(prefix, value));
        }
    };

    return {
        UniqueIdNamespace: UniqueIdNamespace,
        UniqueIdCollection: UniqueIdCollection,
        UniqueIdProvider: UniqueIdProvider
    };

});