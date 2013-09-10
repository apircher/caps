
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
    // Bootstrap Tooltip Binding.
    //
    ko.bindingHandlers.tooltip = {
        update: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = valueAccessor() || {},
                $elem = $(elem),
                initialized = $elem.data('tooltip:initialized');

            if (initialized) {
                destroyTooltip();
                ko.utils.domNodeDisposal.removeDisposeCallback(elem, destroyTooltip);
            }

            if (options.title) {
                var title = ko.unwrap(options.title);
                if (title && title.length) {
                    $elem.tooltip(options);
                    $elem.data('tooltip:initialized', true);
                    ko.utils.domNodeDisposal.addDisposeCallback(elem, destroyTooltip);
                }
            }

            function destroyTooltip() {
                $elem.tooltip('destroy');
            }
        }
    };

    //
    // CancelZoom Binding. (Cancel Mobile Safari zoom in on input fields)
    //
    ko.bindingHandlers.cancelZoom = {
        init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = valueAccessor(), $elem = $(elem);
            $elem.cancelZoom();
        }
    };

    //
    // jQuery Fileupload
    //
    ko.bindingHandlers.fileupload = {
        init: function (elem, valueAccessor, allBindingsAccessor, viewModel) {
            var $elem = $(elem),
                options = valueAccessor();
            var plugin = $elem.fileupload(options);
            plugin.on('progressall', function (e, data) {
                if (options.progressall && typeof (options.progressall) === 'function')
                    options.progressall.call(viewModel, e, data);
            });
            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                $elem.fileupload('destroy');
            });
        }
    };

    //
    // Stretch Height
    //
    ko.bindingHandlers.forceViewportHeight = {
        init: function (elem, valueAccessor) {
            var $elem = $(elem),
                $window = $(window),
                options = valueAccessor();

            $window.on('resize', setElementHeight);
            setElementHeight();

            function setElementHeight() {
                window.setTimeout(function () {
                    ko.bindingHandlers.forceViewportHeight.setElementHeight($window, $elem, options);
                }, 20);
            }

            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                $window.off('resize', setElementHeight);
            });
        },

        update: function (elem, valueAccessor) {
            var $elem = $(elem),
                $window = $(window),
                options = valueAccessor();
            ko.bindingHandlers.forceViewportHeight.setElementHeight($window, $elem, options);
        },

        setElementHeight: function ($window, $elem, options) {

            var viewportWidth = $window.width();
            var viewportHeight = $window.height();

            if (options.minWidth && typeof options.minWidth === 'number') {
                if (options.minWidth >= viewportWidth) {
                    $elem.height('auto');
                    $elem.trigger('stretchHeight:reseted');
                    return;
                }
            }

            if (options.spacers && typeof(options.spacers) === 'string') {
                var $spacers = $(options.spacers);
                $.each($spacers, function (index, spacer) {
                    var spacerHeight = $(spacer).outerHeight();
                    viewportHeight -= spacerHeight;
                });
            }

            var $ce = $elem, $document = $(document);
            while ($ce && ($ce[0].nodeName != 'HTML')) {
                var paddingTop = new Number($ce.css('padding-top').replace('px', ''));
                var paddingBottom = new Number($ce.css('padding-bottom').replace('px', ''));
                var marginTop = new Number($ce.css('margin-top').replace('px', ''));
                var marginBottom = new Number($ce.css('margin-bottom').replace('px', ''));
                viewportHeight -= (paddingTop + paddingBottom + marginTop + marginBottom);
                $ce = $ce.parent();
            }

            if (viewportHeight > 0) {
                $elem.height(viewportHeight + 'px');
                $elem.trigger('stretchHeight:resized');
            }
        }
    };

    ko.bindingHandlers.stretchLineHeight = {
        setLineHeight: function($elem, options) {
            var parentHeight = $elem.parent().innerHeight(); // css('height');
            $elem.css('line-height', (parentHeight - 2) + 'px');
        },
        init: function (elem, valueAccessor) {
            var $elem = $(elem);
            ko.bindingHandlers.stretchLineHeight.setLineHeight($elem);
            $elem.parent().on('stretchHeight:resized', function () {
                ko.bindingHandlers.stretchLineHeight.setLineHeight($elem);
            });
            $elem.parent().on('stretchHeight:reseted', function () {
                $elem.css('line-height', '0');
            });
        }
    };

    //
    // Lazy loading
    //
    ko.bindingHandlers.lazyLoad = {
        init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $window = $(window),
                $elem = $(elem),
                options = valueAccessor(),
                data = options.data,
                timeoutHandle;

            function processScroll() {
                if (timeoutHandle)
                    window.clearTimeout(timeoutHandle);
                timeoutHandle = window.setTimeout(function () {
                    ko.bindingHandlers.lazyLoad._processScroll(elem, options.pageSize, options.loadHandler);
                }, 20);
            }

            $window.on('scroll resize', processScroll);
            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                $window.off('scroll resize', processScroll);
            });
            return ko.bindingHandlers['foreach'].init(elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        },

        update: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {            
            ko.bindingHandlers['foreach'].update(elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        },

        _elementInView: function (elem) {
            var rect = elem.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0)
                return (rect.bottom >= 0 && rect.left >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight));
            return false;
        },

        _processScroll: function (elem, pageSize, loadHandler) {
            console.log('LazyLoad._processScroll called.');
            var $elem = $(elem),
                items = $elem.children(),
                visibleItems = [];
            for (var i = 0; i < items.length; i++) {
                if (ko.bindingHandlers.lazyLoad._elementInView(items[i])) {
                    visibleItems.push(items[i]);
                }
            }

            if (visibleItems.length && loadHandler) {
                var firstVisible = $(visibleItems[0]).index(),
                    lastVisible = $(visibleItems[visibleItems.length - 1]).index(),
                    firstVisiblePage = Math.floor(firstVisible / pageSize),
                    lastVisiblePage = Math.floor(lastVisible / pageSize);
                var eventArgs = {
                    firstVisible: {
                        index: firstVisible,
                        page: firstVisiblePage,
                        viewModel: ko.dataFor(items[firstVisible])
                    },
                    lastVisible: {
                        index: lastVisible,
                        page: lastVisiblePage,
                        viewModel: ko.dataFor(items[lastVisible])
                    },
                    pageLoaded: function (pageNumber) {
                    }
                };

                if (items.length > 0)
                    loadHandler(elem, eventArgs);
            }
        }
    };

    
    ko.bindingHandlers.lazyImage = {
        init: function (elem, valueAccessor) {
            var $window = $(window),
                $elem = $(elem),
                timeoutHandle;

            function processScroll() {
                if (timeoutHandle)
                    window.clearTimeout(timeoutHandle);
                timeoutHandle = window.setTimeout(function () {
                    ko.bindingHandlers.lazyImage._processScroll(elem);
                }, 20);
            }

            $window.on('scroll resize', processScroll);
            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                $window.off('scroll resize', processScroll);
            });
            processScroll();
        },

        _elementInView: function (elem) {
            var rect = elem.getBoundingClientRect();
            return (rect.bottom >= 0 && rect.left >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight));
        },

        _processScroll: function (elem) {
            if (ko.bindingHandlers.lazyImage._elementInView(elem)) {
                var src = elem ? elem.getAttribute('data-src') : '';
                if (src != '' && src != elem.src) {
                    var img = new Image();
                    img.onload = function () {
                        if (elem.parent)
                            elem.parent.replaceChild(img, elem);
                        else
                            elem.src = src;
                    };
                    img.src = src;
                }
            }
        }
    };

    //
    // Infinite Scroll
    //
    ko.bindingHandlers.infiniteScroll = {
        init: function (elem, valueAccessor) {
            var $window = $(window),
                $elem = $(elem),
                distance = -1,
                options = valueAccessor(),
                $container = options.container,
                loading = false,
                enabled = options.enabled;

            if (ko.isObservable(enabled)) {
                enabled.subscribe(getDistance);
            }

            function checkDistance() {
                if (ko.unwrap(enabled) && distance >= 0 && distance < options.distance && !loading) {
                    loading = true;
                    // Fire OnLoad
                    var r = options.loadMoreItems();
                    if (r.then) {
                        r.then(function () {
                            getDistance();
                            loading = false;
                        });
                    }
                    else
                        loading = false;
                }
            }

            function getDistance() {
                distance = Math.max(0, $elem.height() - $container.height() - $container.scrollTop());
            }

            getDistance();
            $window.on('scroll resize', getDistance);
            var handle = setInterval(checkDistance, 100);
            
            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                $window.off('scroll resize', getDistance);
                clearInterval(handle);
            });
        }
    };

    //
    // ScrollTop
    //
    ko.bindingHandlers.scrollTop = {
        init: function (elem, valueAccessor) {
            var $window = $(window),
                options = valueAccessor(),
                observable = options.observable,
                enabled = options.enabled;

            function _saveScrollTop() {
                if (ko.unwrap(enabled)) ko.bindingHandlers.scrollTop.saveScrollTop(observable);
            }
            function _restoreScrollTop() {
                if (ko.unwrap(enabled)) ko.bindingHandlers.scrollTop.restoreScrollTop(observable);
            }

            _restoreScrollTop();
            $window.on('scroll resize', _saveScrollTop);
            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                $window.off('scroll resize', _saveScrollTop);
            });
        },

        update: function (elem, valueAccessor) {
            var options = valueAccessor(),
                observable = options.observable,
                enabled = options.enabled;
            if (ko.unwrap(enabled)) ko.bindingHandlers.scrollTop.restoreScrollTop(observable);
        },

        saveScrollTop: function (o) {
            if (ko.isObservable(o)) {
                var st = $('html').scrollTop() || $('body').scrollTop();
                console.log('saveScrollTop, offset=' + st);
                if (o() !== st) o(st);
            }
        },

        restoreScrollTop: function (o) {
            if (ko.isObservable(o) && o()) {
                var st = $('html').scrollTop() || $('body').scrollTop();
                console.log('restoreScrollTop, offset=' + st);
                if (o() != st) $('html, body').scrollTop(o());
            }
        }
    };
    
    //
    // Editor Templates
    //
    ko.bindingHandlers.composeEditor = {
        prepareOptions: function (valueAccessor) {
            var options = valueAccessor() || {},
                type = options.type || 'input';

            var defaultOptions = {
                field: null,
                title: '',
                valueUpdate: '',
                css: {},
                placeholder: ''
            };

            return {
                view: 'views/editorTemplates/' + type + 'Template',
                model: $.extend(defaultOptions, options)
            };
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
    // Validation Summary
    //
    ko.bindingHandlers.validationSummary = {
        prepareOptions: function (valueAccessor) {
            var value = valueAccessor() || {},
                entity = value.entity || {},
                errors = entity.errors;

            var defaultOptions = {
                title: errors().length == 1 ? 'Noch 1 Eingabe ungültig' : 'Noch ' + errors().length + ' Eingaben ungültig'
            };

            return {
                view: 'views/partial/validationSummary',
                model: $.extend(defaultOptions, value)
            };
        },
        init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var newValueAccessor = function () {
                return ko.bindingHandlers.validationSummary.prepareOptions(valueAccessor);
            };
            ko.bindingHandlers.compose.init(elem, newValueAccessor, allBindingsAccessor, viewModel, bindingContext);
        },
        update: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var newValueAccessor = function () {
                return ko.bindingHandlers.validationSummary.prepareOptions(valueAccessor);
            };
            ko.bindingHandlers.compose.update(elem, newValueAccessor, allBindingsAccessor, viewModel, bindingContext);
        }
    };
    ko.virtualElements.allowedBindings.validationSummary = true;

    //
    // Periodic Update of displayed text
    //
    ko.bindingHandlers.textTimeout = {
        clearInterval: function (elem) {
            var $elem = $(elem),
              handle = $elem.data('textTimeoutInterval');

            if (handle) {
                window.clearInterval(handle);
                $elem.data('textTimeoutInterval', null);
            }
        },
        configureUpdate: function (elem, options, allBindingsAccessor) {
            var $elem = $(elem),
                text = allBindingsAccessor().text;

            ko.bindingHandlers.textTimeout.clearInterval(elem);
                        
            if (options.interval && text) {
                var handle = window.setInterval(updateText, options.interval);
                $elem.data('textTimeoutInterval', handle);
            }

            function updateText() {
                options.observable.valueHasMutated();
            }
        },
        init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var valueOrObservable = valueAccessor(),
                value = ko.unwrap(valueOrObservable);
            ko.bindingHandlers.textTimeout.configureUpdate(elem, value, allBindingsAccessor);
            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                ko.bindingHandlers.textTimeout.clearInterval(elem);
            });
        },
        update: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var valueOrObservable = valueAccessor(),
                value = ko.unwrap(valueOrObservable);
            ko.bindingHandlers.textTimeout.configureUpdate(elem, value, allBindingsAccessor);
        }
    };

    //
    // Live search
    //
    (function (ko) {

        function callSearchHandler($element, options) {
            if (options.searchObservable && ko.isObservable(options.searchObservable))
                options.searchObservable($element.val());
            if (options.searchHandler && (typeof options.searchHandler === 'function'))
                options.searchHandler.call(this, $element);
        }

        function callSearchHandlerDelayed($element, options) {
            var timeout = $element.data('search-timeout');
            if (timeout) window.clearTimeout(timeout);
            timeout = window.setTimeout(function () { callSearchHandler($element, options); }, options.timeout || 750);
            $element.data('search-timeout', timeout);
        }

        ko.bindingHandlers.delayedSearch = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options = valueAccessor() || {};
                var $element = $(element);
                $element.data('oldVal', $element.val());
                $element.bind("propertychange keyup input paste", function (e) {
                    if ($element.data('oldVal') != $element.val()) {
                        $element.data('oldVal', $element.val());

                        var minLength = options.minLength || 2;
                        var length = $element.val().length;
                        if (length == 0 || length >= minLength)
                            callSearchHandlerDelayed($element, options);
                    }
                });
            },
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var options = valueAccessor() || {};
                var $element = $(element);

                if (options.searchObservable && ko.isObservable(options.searchObservable)) {
                    $element.data('oldVal', options.searchObservable());
                    $element.val(options.searchObservable());
                }
            }
        };

    })(ko);
    
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