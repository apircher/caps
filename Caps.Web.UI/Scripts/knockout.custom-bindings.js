
(function(ko, $) {
    
    var $window = $(window),
        $html = $('html'),
        $body = $('body');

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
    // Twitter Typeahead Binding.
    //
    // From https://github.com/billpull/knockout-bootstrap.
    ko.bindingHandlers.typeahead = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element);
            var allBindings = allBindingsAccessor();
            var typeaheadArr = ko.utils.unwrapObservable(valueAccessor());

            $element.attr("autocomplete", "off")
                    .typeahead({
                        'local': typeaheadArr,
                        'minLength': allBindings.minLength
                    });
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
    // fixedPosition
    //
    ko.bindingHandlers.fixedPosition = {
        update: function (elem, valueAccessor) {
            var $elem = $(elem),
                options = valueAccessor() || {};
            ko.bindingHandlers.fixedPosition.setElementPosition($elem, options);
        },

        setElementPosition: function ($elem, options) {
            var viewportWidth = $window.width();
            if (options.minWidth && typeof options.minWidth === 'number') {
                if (options.minWidth >= viewportWidth) {
                    $elem.css('position', 'static');
                    return;
                }
            }

            $elem.css('position', 'fixed');
            if (options.below && typeof options.below === 'string') {
                var $below = $(options.below),
                    elemY = $below.offset().top + $below.outerHeight() + new Number($below.css('margin-bottom').replace('px', ''));
                $elem.css('top', elemY + 'px');
            }
        }
    }

    //
    // forceViewportHeight
    //
    ko.bindingHandlers.forceViewportHeight = {
        init: function (elem, valueAccessor) {
            var $elem = $(elem),
                options = valueAccessor();

            setElementHeight();

            var th;
            function setElementHeight() {
                if (th) window.clearTimeout(th);
                th = window.setTimeout(function () {
                    ko.bindingHandlers.forceViewportHeight.setElementHeight($window, $elem, options);
                }, 20);
            }

            $window.on('resize', setElementHeight);
            $window.on('forceViewportHeight:refresh', setElementHeight);

            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                $window.off('resize', setElementHeight);
                $window.off('forceViewportHeight:refresh', setElementHeight);
            });
        },

        update: function (elem, valueAccessor) {
            var $elem = $(elem),
                options = valueAccessor();
            ko.bindingHandlers.forceViewportHeight.setElementHeight($window, $elem, options);
        },

        setElementHeight: function ($window, $elem, options) {

            if (!$elem.is(':visible')) return;
                        
            var viewportWidth = $window.width();
            var viewportHeight = $window.height();

            if (options.minWidth && typeof options.minWidth === 'number') {
                if (options.minWidth >= viewportWidth) {
                    $elem.height('auto');
                    $elem.trigger('stretchHeight:reseted');
                    return;
                }
            }

            var offset = $elem.offset();
            viewportHeight -= offset.top;

            if (options.spacers && typeof(options.spacers) === 'string') {
                var $spacers = $(options.spacers);
                $.each($spacers, function (index, spacer) {
                    var spacerHeight = $(spacer).outerHeight();
                    viewportHeight -= spacerHeight;
                });
            }

            var $ce = $elem;
            while ($ce && $ce.length && ($ce[0].nodeName != 'HTML')) {
                var paddingBottom = new Number($ce.css('padding-bottom').replace('px', ''));
                var marginBottom = new Number($ce.css('margin-bottom').replace('px', ''));
                viewportHeight -= (paddingBottom + marginBottom);
                $ce = $ce.parent();
            }

            var borderTopWidth = $elem.css('border-top-width').replace('px', '');
            var borderBottomWidth = $elem.css('border-bottom-width').replace('px', '');
            viewportHeight -= (borderTopWidth + borderBottomWidth);

            if (viewportHeight > 0) {
                $elem.height(viewportHeight + 'px');
                $elem.trigger('stretchHeight:resized');
            }
        }
    };


    //
    // stretchLineHeight
    //
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
    // ScrollIntoViewTrigger
    //
    ko.bindingHandlers.scrollIntoViewTrigger = {
        init: function (elem, valueAccessor) {
            var options = valueAccessor() || {},
                $elem = $(elem);

            if (options.source && options.source.attach) {
                options.source.attach({
                    trigger: function () {
                        var $container = findScrollParent($elem);
                        if ($container && !isElementVisible($container, $elem))
                            scrollElementIntoView($container, $elem);
                    }
                });
            }

            function findScrollParent(element) {
                var current = element.parent();
                while (current && current.length && (current[0].nodeName != 'HTML')) {
                    var overflowX = current.css('overflow-x');
                    var overflowY = current.css('overflow-y');
                    if (overflowX === 'scroll' || overflowY === 'scroll')
                        return current;
                    current = current.parent();
                }
                return null;
            }

            function isElementVisible(container, element) {
                var nfo = getScrollInfo(container, element);
                return nfo.elemY1 >= 0 && nfo.elemY2 < container.height();
            }

            function scrollElementIntoView(container, element) {
                var nfo = getScrollInfo(container, element);
                if (nfo.elemY1 < 0) {
                    container.scrollTop(nfo.scrollTop + nfo.elemY1);
                }
                else if (nfo.elemY2 > container.height()) {
                    container.scrollTop(nfo.scrollTop + (nfo.elemY2 - container.height()));
                }
            }

            function getScrollInfo(container, element) {
                var pos = element.position(),
                    scrollTop = container.scrollTop(),
                    elemY1, elemY2;

                try {
                    elemY1 = pos.top - container.position().top; 
                }
                catch (error) {
                    elemY1 = 0;
                }                    
                elemY2 = elemY1 + element.outerHeight();

                return {
                    scrollTop: scrollTop,
                    elemY1: elemY1,
                    elemY2: elemY2,
                    viewTop: scrollTop,
                    viewBottom: scrollTop + container.height()
                }
            }
        }
    };

    //
    // Lazy loading
    //
    ko.bindingHandlers.lazyLoad = {
        init: function (elem, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $elem = $(elem),
                options = valueAccessor(),
                data = options.data,
                timeoutHandle;

            function processScroll() {
                if (timeoutHandle)
                    window.clearTimeout(timeoutHandle);
                timeoutHandle = window.setTimeout(function () {
                    ko.bindingHandlers.lazyLoad._processScroll(elem, options.loadHandler);
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

        _processScroll: function (elem, loadHandler) {
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
                    lastVisible = $(visibleItems[visibleItems.length - 1]).index();
                var eventArgs = {
                    firstVisible: {
                        index: firstVisible,
                        viewModel: ko.dataFor(items[firstVisible])
                    },
                    lastVisible: {
                        index: lastVisible,
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
            var $elem = $(elem),
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
            var $elem = $(elem),
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
            var options = valueAccessor(),
                observable = options.observable,
                enabled = options.enabled,
                $elem = $(elem),
                $container = $elem.css('overflow-y') == 'scroll' ? $elem : $window;

            options.container = $container;

            function _saveScrollTop() {
                if (ko.unwrap(enabled)) ko.bindingHandlers.scrollTop.saveScrollTop($elem, options);
            }
            function _restoreScrollTop() {
                if (ko.unwrap(enabled)) ko.bindingHandlers.scrollTop.restoreScrollTop($elem, options);
            }

            _restoreScrollTop();

            $container.on('scroll', _saveScrollTop);
            $window.on('resize', _saveScrollTop);

            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                $container.off('scroll', _saveScrollTop);
                $window.off('resize', _saveScrollTop);
            });
        },

        update: function (elem, valueAccessor) {
            var options = valueAccessor(),
                observable = options.observable,
                enabled = options.enabled,
                $elem = $(elem),
                $container = $elem.css('overflow-y') == 'scroll' ? $elem : $window;
            options.container = $container;
            if (ko.unwrap(enabled)) ko.bindingHandlers.scrollTop.restoreScrollTop($elem, options);
        },

        saveScrollTop: function ($elem, options) {
            var o = options.observable;
            if (ko.isObservable(o)) {
                var st = options.container === $window ? $html.scrollTop() || $body.scrollTop() : options.container.scrollTop();
                console.log('saveScrollTop, offset=' + st);
                if (ko.unwrap(o) !== st) {
                    o(st);
                }
            }
        },

        restoreScrollTop: function ($elem, options) {
            var o = options.observable;
            if (ko.isObservable(o) && o()) {
                var st = options.container === $window ? $html.scrollTop() || $body.scrollTop() : options.container.scrollTop();
                if (ko.unwrap(o) !== st) {
                    console.log('restoreScrollTop, offset=' + o());
                    window.setTimeout(function () {
                        if (options.container === $window) $('html, body').scrollTop(o());
                        else options.container.scrollTop(o());
                    }, 0);
                }
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

})(ko, jQuery);