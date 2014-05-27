(function () {
/**
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    function onResourceLoad(name, defined, deps){
        if(requirejs.onResourceLoad && name){
            requirejs.onResourceLoad({defined:defined}, {id:name}, deps);
        }
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }

        onResourceLoad(name, defined, args);
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../Scripts/almond-custom", function(){});

define('durandal/system',["require","jquery"],function(e,t){function n(e){var t="[object "+e+"]";r["is"+e]=function(e){return s.call(e)==t}}var r,i=!1,a=Object.keys,o=Object.prototype.hasOwnProperty,s=Object.prototype.toString,l=!1,u=Array.isArray,c=Array.prototype.slice;if(Function.prototype.bind&&("object"==typeof console||"function"==typeof console)&&"object"==typeof console.log)try{["log","info","warn","error","assert","dir","clear","profile","profileEnd"].forEach(function(e){console[e]=this.call(console[e],console)},Function.prototype.bind)}catch(d){l=!0}e.on&&e.on("moduleLoaded",function(e,t){r.setModuleId(e,t)}),"undefined"!=typeof requirejs&&(requirejs.onResourceLoad=function(e,t){r.setModuleId(e.defined[t.id],t.id)});var f=function(){},p=function(){try{if("undefined"!=typeof console&&"function"==typeof console.log)if(window.opera)for(var e=0;e<arguments.length;)console.log("Item "+(e+1)+": "+arguments[e]),e++;else 1==c.call(arguments).length&&"string"==typeof c.call(arguments)[0]?console.log(c.call(arguments).toString()):console.log.apply(console,c.call(arguments));else Function.prototype.bind&&!l||"undefined"==typeof console||"object"!=typeof console.log||Function.prototype.call.call(console.log,console,c.call(arguments))}catch(t){}},h=function(e){if(e instanceof Error)throw e;throw new Error(e)};r={version:"2.0.1",noop:f,getModuleId:function(e){return e?"function"==typeof e?e.prototype.__moduleId__:"string"==typeof e?null:e.__moduleId__:null},setModuleId:function(e,t){return e?"function"==typeof e?(e.prototype.__moduleId__=t,void 0):("string"!=typeof e&&(e.__moduleId__=t),void 0):void 0},resolveObject:function(e){return r.isFunction(e)?new e:e},debug:function(e){return 1==arguments.length&&(i=e,i?(this.log=p,this.error=h,this.log("Debug:Enabled")):(this.log("Debug:Disabled"),this.log=f,this.error=f)),i},log:f,error:f,assert:function(e,t){e||r.error(new Error(t||"Assert:Failed"))},defer:function(e){return t.Deferred(e)},guid:function(){var e=(new Date).getTime();return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){var n=0|(e+16*Math.random())%16;return e=Math.floor(e/16),("x"==t?n:8|7&n).toString(16)})},acquire:function(){var t,n=arguments[0],i=!1;return r.isArray(n)?(t=n,i=!0):t=c.call(arguments,0),this.defer(function(n){e(t,function(){var e=arguments;setTimeout(function(){e.length>1||i?n.resolve(c.call(e,0)):n.resolve(e[0])},1)},function(e){n.reject(e)})}).promise()},extend:function(e){for(var t=c.call(arguments,1),n=0;n<t.length;n++){var r=t[n];if(r)for(var i in r)e[i]=r[i]}return e},wait:function(e){return r.defer(function(t){setTimeout(t.resolve,e)}).promise()}},r.keys=a||function(e){if(e!==Object(e))throw new TypeError("Invalid object");var t=[];for(var n in e)o.call(e,n)&&(t[t.length]=n);return t},r.isElement=function(e){return!(!e||1!==e.nodeType)},r.isArray=u||function(e){return"[object Array]"==s.call(e)},r.isObject=function(e){return e===Object(e)},r.isBoolean=function(e){return"boolean"==typeof e},r.isPromise=function(e){return e&&r.isFunction(e.then)};for(var v=["Arguments","Function","String","Number","Date","RegExp"],m=0;m<v.length;m++)n(v[m]);return r});
define('infrastructure/serverUtil',[],function(){return{mapPath:function(e){var t=capsConfig.applicationPath;return e.startsWith(t)?e:e.replace(/^~/,function(){return"/"===t?"":t})}}});
define('infrastructure/antiForgeryToken',["durandal/system","jquery","infrastructure/serverUtil"],function(e,n){function t(){return e.defer(function(e){n.ajax(i,{method:"get"}).done(function(n){r=n,e.resolve()}).fail(e.reject)}).promise()}var r={c:"",f:""},i="~/api/antiforgery/tokens";return n(document).ajaxSend(function(e,n,t){t.url.endsWith(i.slice(1))||n.setRequestHeader("RequestVerificationToken",r.c+":"+r.f)}),{initToken:t}});
define('durandal/viewEngine',["durandal/system","jquery"],function(e,t){var n;return n=t.parseHTML?function(e){return t.parseHTML(e)}:function(e){return t(e).get()},{viewExtension:".html",viewPlugin:"text",isViewUrl:function(e){return-1!==e.indexOf(this.viewExtension,e.length-this.viewExtension.length)},convertViewUrlToViewId:function(e){return e.substring(0,e.length-this.viewExtension.length)},convertViewIdToRequirePath:function(e){return this.viewPlugin+"!"+e+this.viewExtension},parseMarkup:n,processMarkup:function(e){var t=this.parseMarkup(e);return this.ensureSingleElement(t)},ensureSingleElement:function(e){if(1==e.length)return e[0];for(var n=[],r=0;r<e.length;r++){var i=e[r];if(8!=i.nodeType){if(3==i.nodeType){var a=/\S/.test(i.nodeValue);if(!a)continue}n.push(i)}}return n.length>1?t(n).wrapAll('<div class="durandal-wrapper"></div>').parent().get(0):n[0]},createView:function(t){var n=this,r=this.convertViewIdToRequirePath(t);return e.defer(function(i){e.acquire(r).then(function(e){var r=n.processMarkup(e);r.setAttribute("data-view",t),i.resolve(r)}).fail(function(e){n.createFallbackView(t,r,e).then(function(e){e.setAttribute("data-view",t),i.resolve(e)})})}).promise()},createFallbackView:function(t,n){var r=this,i='View Not Found. Searched for "'+t+'" via path "'+n+'".';return e.defer(function(e){e.resolve(r.processMarkup('<div class="durandal-view-404">'+i+"</div>"))}).promise()}}});
define('durandal/viewLocator',["durandal/system","durandal/viewEngine"],function(e,t){function n(e,t){for(var n=0;n<e.length;n++){var r=e[n],i=r.getAttribute("data-view");if(i==t)return r}}function r(e){return(e+"").replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g,"\\$1")}return{useConvention:function(e,t,n){e=e||"viewmodels",t=t||"views",n=n||t;var i=new RegExp(r(e),"gi");this.convertModuleIdToViewId=function(e){return e.replace(i,t)},this.translateViewIdToArea=function(e,t){return t&&"partial"!=t?n+"/"+t+"/"+e:n+"/"+e}},locateViewForObject:function(t,n,r){var i;if(t.getView&&(i=t.getView()))return this.locateView(i,n,r);if(t.viewUrl)return this.locateView(t.viewUrl,n,r);var a=e.getModuleId(t);return a?this.locateView(this.convertModuleIdToViewId(a),n,r):this.locateView(this.determineFallbackViewId(t),n,r)},convertModuleIdToViewId:function(e){return e},determineFallbackViewId:function(e){var t=/function (.{1,})\(/,n=t.exec(e.constructor.toString()),r=n&&n.length>1?n[1]:"";return"views/"+r},translateViewIdToArea:function(e){return e},locateView:function(r,i,a){if("string"==typeof r){var o;if(o=t.isViewUrl(r)?t.convertViewUrlToViewId(r):r,i&&(o=this.translateViewIdToArea(o,i)),a){var s=n(a,o);if(s)return e.defer(function(e){e.resolve(s)}).promise()}return t.createView(o)}return e.defer(function(e){e.resolve(r)}).promise()}}});
define('durandal/binder',["durandal/system","knockout"],function(e,t){function n(t){return void 0===t?{applyBindings:!0}:e.isBoolean(t)?{applyBindings:t}:(void 0===t.applyBindings&&(t.applyBindings=!0),t)}function r(r,u,c,d){if(!u||!c)return i.throwOnErrors?e.error(a):e.log(a,u,d),void 0;if(!u.getAttribute)return i.throwOnErrors?e.error(o):e.log(o,u,d),void 0;var f=u.getAttribute("data-view");try{var p;return r&&r.binding&&(p=r.binding(u)),p=n(p),i.binding(d,u,p),p.applyBindings?(e.log("Binding",f,d),t.applyBindings(c,u)):r&&t.utils.domData.set(u,l,{$data:r}),i.bindingComplete(d,u,p),r&&r.bindingComplete&&r.bindingComplete(u),t.utils.domData.set(u,s,p),p}catch(h){h.message=h.message+";\nView: "+f+";\nModuleId: "+e.getModuleId(d),i.throwOnErrors?e.error(h):e.log(h.message)}}var i,a="Insufficient Information to Bind",o="Unexpected View Type",s="durandal-binding-instruction",l="__ko_bindingContext__";return i={binding:e.noop,bindingComplete:e.noop,throwOnErrors:!1,getBindingInstruction:function(e){return t.utils.domData.get(e,s)},bindContext:function(e,t,n){return n&&e&&(e=e.createChildContext(n)),r(n,t,e,n||(e?e.$data:null))},bind:function(e,t){return r(e,t,e,e)}}});
define('durandal/activator',["durandal/system","knockout"],function(e,t){function n(e){return void 0==e&&(e={}),e.closeOnDeactivate||(e.closeOnDeactivate=u.defaults.closeOnDeactivate),e.beforeActivate||(e.beforeActivate=u.defaults.beforeActivate),e.afterDeactivate||(e.afterDeactivate=u.defaults.afterDeactivate),e.affirmations||(e.affirmations=u.defaults.affirmations),e.interpretResponse||(e.interpretResponse=u.defaults.interpretResponse),e.areSameItem||(e.areSameItem=u.defaults.areSameItem),e}function r(t,n,r){return e.isArray(r)?t[n].apply(t,r):t[n](r)}function i(t,n,r,i,a){if(t&&t.deactivate){e.log("Deactivating",t);var o;try{o=t.deactivate(n)}catch(s){return e.error(s),i.resolve(!1),void 0}o&&o.then?o.then(function(){r.afterDeactivate(t,n,a),i.resolve(!0)},function(t){e.log(t),i.resolve(!1)}):(r.afterDeactivate(t,n,a),i.resolve(!0))}else t&&r.afterDeactivate(t,n,a),i.resolve(!0)}function a(t,n,i,a){if(t)if(t.activate){e.log("Activating",t);var o;try{o=r(t,"activate",a)}catch(s){return e.error(s),i(!1),void 0}o&&o.then?o.then(function(){n(t),i(!0)},function(t){e.log(t),i(!1)}):(n(t),i(!0))}else n(t),i(!0);else i(!0)}function o(t,n,r){return r.lifecycleData=null,e.defer(function(i){if(t&&t.canDeactivate){var a;try{a=t.canDeactivate(n)}catch(o){return e.error(o),i.resolve(!1),void 0}a.then?a.then(function(e){r.lifecycleData=e,i.resolve(r.interpretResponse(e))},function(t){e.error(t),i.resolve(!1)}):(r.lifecycleData=a,i.resolve(r.interpretResponse(a)))}else i.resolve(!0)}).promise()}function s(t,n,i,a){return i.lifecycleData=null,e.defer(function(o){if(t==n())return o.resolve(!0),void 0;if(t&&t.canActivate){var s;try{s=r(t,"canActivate",a)}catch(l){return e.error(l),o.resolve(!1),void 0}s.then?s.then(function(e){i.lifecycleData=e,o.resolve(i.interpretResponse(e))},function(t){e.error(t),o.resolve(!1)}):(i.lifecycleData=s,o.resolve(i.interpretResponse(s)))}else o.resolve(!0)}).promise()}function l(r,l){var u,c=t.observable(null);l=n(l);var d=t.computed({read:function(){return c()},write:function(e){d.viaSetter=!0,d.activateItem(e)}});return d.__activator__=!0,d.settings=l,l.activator=d,d.isActivating=t.observable(!1),d.canDeactivateItem=function(e,t){return o(e,t,l)},d.deactivateItem=function(t,n){return e.defer(function(e){d.canDeactivateItem(t,n).then(function(r){r?i(t,n,l,e,c):(d.notifySubscribers(),e.resolve(!1))})}).promise()},d.canActivateItem=function(e,t){return s(e,c,l,t)},d.activateItem=function(t,n){var r=d.viaSetter;return d.viaSetter=!1,e.defer(function(o){if(d.isActivating())return o.resolve(!1),void 0;d.isActivating(!0);var s=c();return l.areSameItem(s,t,u,n)?(d.isActivating(!1),o.resolve(!0),void 0):(d.canDeactivateItem(s,l.closeOnDeactivate).then(function(f){f?d.canActivateItem(t,n).then(function(f){f?e.defer(function(e){i(s,l.closeOnDeactivate,l,e)}).promise().then(function(){t=l.beforeActivate(t,n),a(t,c,function(e){u=n,d.isActivating(!1),o.resolve(e)},n)}):(r&&d.notifySubscribers(),d.isActivating(!1),o.resolve(!1))}):(r&&d.notifySubscribers(),d.isActivating(!1),o.resolve(!1))}),void 0)}).promise()},d.canActivate=function(){var e;return r?(e=r,r=!1):e=d(),d.canActivateItem(e)},d.activate=function(){var e;return r?(e=r,r=!1):e=d(),d.activateItem(e)},d.canDeactivate=function(e){return d.canDeactivateItem(d(),e)},d.deactivate=function(e){return d.deactivateItem(d(),e)},d.includeIn=function(e){e.canActivate=function(){return d.canActivate()},e.activate=function(){return d.activate()},e.canDeactivate=function(e){return d.canDeactivate(e)},e.deactivate=function(e){return d.deactivate(e)}},l.includeIn?d.includeIn(l.includeIn):r&&d.activate(),d.forItems=function(t){l.closeOnDeactivate=!1,l.determineNextItemToActivate=function(e,t){var n=t-1;return-1==n&&e.length>1?e[1]:n>-1&&n<e.length-1?e[n]:null},l.beforeActivate=function(e){var n=d();if(e){var r=t.indexOf(e);-1==r?t.push(e):e=t()[r]}else e=l.determineNextItemToActivate(t,n?t.indexOf(n):0);return e},l.afterDeactivate=function(e,n){n&&t.remove(e)};var n=d.canDeactivate;d.canDeactivate=function(r){return r?e.defer(function(e){function n(){for(var t=0;t<a.length;t++)if(!a[t])return e.resolve(!1),void 0;e.resolve(!0)}for(var i=t(),a=[],o=0;o<i.length;o++)d.canDeactivateItem(i[o],r).then(function(e){a.push(e),a.length==i.length&&n()})}).promise():n()};var r=d.deactivate;return d.deactivate=function(n){return n?e.defer(function(e){function r(r){d.deactivateItem(r,n).then(function(){a++,t.remove(r),a==o&&e.resolve()})}for(var i=t(),a=0,o=i.length,s=0;o>s;s++)r(i[s])}).promise():r()},d},d}var u,c={closeOnDeactivate:!0,affirmations:["yes","ok","true"],interpretResponse:function(n){return e.isObject(n)&&(n=n.can||!1),e.isString(n)?-1!==t.utils.arrayIndexOf(this.affirmations,n.toLowerCase()):n},areSameItem:function(e,t){return e==t},beforeActivate:function(e){return e},afterDeactivate:function(e,t,n){t&&n&&n(null)}};return u={defaults:c,create:l,isActivator:function(e){return e&&e.__activator__}}});
define('durandal/composition',["durandal/system","durandal/viewLocator","durandal/binder","durandal/viewEngine","durandal/activator","jquery","knockout"],function(e,t,n,r,i,a,o){function s(e){for(var t=[],n={childElements:t,activeView:null},r=o.virtualElements.firstChild(e);r;)1==r.nodeType&&(t.push(r),r.getAttribute(k)&&(n.activeView=r)),r=o.virtualElements.nextSibling(r);return n.activeView||(n.activeView=t[0]),n}function l(){C--,0===C&&setTimeout(function(){for(var t=N.length;t--;)try{N[t]()}catch(n){e.error(n)}N=[]},1)}function u(e){delete e.activeView,delete e.viewElements}function c(t,n,r){if(r)n();else if(t.activate&&t.model&&t.model.activate){var i;try{i=e.isArray(t.activationData)?t.model.activate.apply(t.model,t.activationData):t.model.activate(t.activationData),i&&i.then?i.then(n,function(t){e.error(t),n()}):i||void 0===i?n():(l(),u(t))}catch(a){e.error(a)}}else n()}function d(){var t=this;if(t.activeView&&t.activeView.removeAttribute(k),t.child)try{t.model&&t.model.attached&&(t.composingNewView||t.alwaysTriggerAttach)&&t.model.attached(t.child,t.parent,t),t.attached&&t.attached(t.child,t.parent,t),t.child.setAttribute(k,!0),t.composingNewView&&t.model&&t.model.detached&&o.utils.domNodeDisposal.addDisposeCallback(t.child,function(){try{t.model.detached(t.child,t.parent,t)}catch(n){e.error(n)}})}catch(n){e.error(n)}t.triggerAttach=e.noop}function f(t){if(e.isString(t.transition)){if(t.activeView){if(t.activeView==t.child)return!1;if(!t.child)return!0;if(t.skipTransitionOnSameViewId){var n=t.activeView.getAttribute("data-view"),r=t.child.getAttribute("data-view");return n!=r}}return!0}return!1}function p(e){for(var t=0,n=e.length,r=[];n>t;t++){var i=e[t].cloneNode(!0);r.push(i)}return r}function h(e){var t=p(e.parts),n=y.getParts(t,null,!0),r=y.getParts(e.child);for(var i in n)a(r[i]).replaceWith(n[i])}function v(t){var n,r,i=o.virtualElements.childNodes(t.parent);if(!e.isArray(i)){var a=[];for(n=0,r=i.length;r>n;n++)a[n]=i[n];i=a}for(n=1,r=i.length;r>n;n++)o.removeNode(i[n])}function m(e){o.utils.domData.set(e,I,e.style.display),e.style.display="none"}function g(e){e.style.display=o.utils.domData.get(e,I)}function b(e){var t=e.getAttribute("data-bind");if(!t)return!1;for(var n=0,r=M.length;r>n;n++)if(t.indexOf(M[n])>-1)return!0;return!1}var y,w={},k="data-active-view",N=[],C=0,x="durandal-composition-data",D="data-part",S=["model","view","transition","area","strategy","activationData"],I="durandal-visibility-data",M=["compose:"],F={complete:function(e){N.push(e)}};return y={composeBindings:M,convertTransitionToModuleId:function(e){return"transitions/"+e},defaultTransitionName:null,current:F,addBindingHandler:function(e,t,n){var r,i,a="composition-handler-"+e;t=t||o.bindingHandlers[e],n=n||function(){return void 0},i=o.bindingHandlers[e]={init:function(e,r,i,s,l){if(C>0){var u={trigger:o.observable(null)};y.current.complete(function(){t.init&&t.init(e,r,i,s,l),t.update&&(o.utils.domData.set(e,a,t),u.trigger("trigger"))}),o.utils.domData.set(e,a,u)}else o.utils.domData.set(e,a,t),t.init&&t.init(e,r,i,s,l);return n(e,r,i,s,l)},update:function(e,t,n,r,i){var s=o.utils.domData.get(e,a);return s.update?s.update(e,t,n,r,i):(s.trigger&&s.trigger(),void 0)}};for(r in t)"init"!==r&&"update"!==r&&(i[r]=t[r])},getParts:function(e,t,n){if(t=t||{},!e)return t;void 0===e.length&&(e=[e]);for(var r=0,i=e.length;i>r;r++){var a=e[r];if(a.getAttribute){if(!n&&b(a))continue;var o=a.getAttribute(D);o&&(t[o]=a),!n&&a.hasChildNodes()&&y.getParts(a.childNodes,t)}}return t},cloneNodes:p,finalize:function(t){if(void 0===t.transition&&(t.transition=this.defaultTransitionName),t.child||t.activeView)if(f(t)){var r=this.convertTransitionToModuleId(t.transition);e.acquire(r).then(function(e){t.transition=e,e(t).then(function(){if(t.cacheViews){if(t.activeView){var e=n.getBindingInstruction(t.activeView);e&&void 0!=e.cacheViews&&!e.cacheViews&&o.removeNode(t.activeView)}}else t.child?v(t):o.virtualElements.emptyNode(t.parent);t.triggerAttach(),l(),u(t)})}).fail(function(t){e.error("Failed to load transition ("+r+"). Details: "+t.message)})}else{if(t.child!=t.activeView){if(t.cacheViews&&t.activeView){var i=n.getBindingInstruction(t.activeView);!i||void 0!=i.cacheViews&&!i.cacheViews?o.removeNode(t.activeView):m(t.activeView)}t.child?(t.cacheViews||v(t),g(t.child)):t.cacheViews||o.virtualElements.emptyNode(t.parent)}t.triggerAttach(),l(),u(t)}else t.cacheViews||o.virtualElements.emptyNode(t.parent),t.triggerAttach(),l(),u(t)},bindAndShow:function(e,t,i){t.child=e,t.composingNewView=t.cacheViews?-1==o.utils.arrayIndexOf(t.viewElements,e):!0,c(t,function(){if(t.binding&&t.binding(t.child,t.parent,t),t.preserveContext&&t.bindingContext)t.composingNewView&&(t.parts&&h(t),m(e),o.virtualElements.prepend(t.parent,e),n.bindContext(t.bindingContext,e,t.model));else if(e){var i=t.model||w,a=o.dataFor(e);if(a!=i){if(!t.composingNewView)return o.removeNode(e),r.createView(e.getAttribute("data-view")).then(function(e){y.bindAndShow(e,t,!0)}),void 0;t.parts&&h(t),m(e),o.virtualElements.prepend(t.parent,e),n.bind(i,e)}}y.finalize(t)},i)},defaultStrategy:function(e){return t.locateViewForObject(e.model,e.area,e.viewElements)},getSettings:function(t){var n,a=t(),s=o.utils.unwrapObservable(a)||{},l=i.isActivator(a);if(e.isString(s))return s=r.isViewUrl(s)?{view:s}:{model:s,activate:!0};if(n=e.getModuleId(s))return s={model:s,activate:!0};!l&&s.model&&(l=i.isActivator(s.model));for(var u in s)s[u]=-1!=o.utils.arrayIndexOf(S,u)?o.utils.unwrapObservable(s[u]):s[u];return l?s.activate=!1:void 0===s.activate&&(s.activate=!0),s},executeStrategy:function(e){e.strategy(e).then(function(t){y.bindAndShow(t,e)})},inject:function(n){return n.model?n.view?(t.locateView(n.view,n.area,n.viewElements).then(function(e){y.bindAndShow(e,n)}),void 0):(n.strategy||(n.strategy=this.defaultStrategy),e.isString(n.strategy)?e.acquire(n.strategy).then(function(e){n.strategy=e,y.executeStrategy(n)}).fail(function(t){e.error("Failed to load view strategy ("+n.strategy+"). Details: "+t.message)}):this.executeStrategy(n),void 0):(this.bindAndShow(null,n),void 0)},compose:function(n,r,i,a){C++,a||(r=y.getSettings(function(){return r},n)),r.compositionComplete&&N.push(function(){r.compositionComplete(r.child,r.parent,r)}),N.push(function(){r.composingNewView&&r.model&&r.model.compositionComplete&&r.model.compositionComplete(r.child,r.parent,r)});var o=s(n);r.activeView=o.activeView,r.parent=n,r.triggerAttach=d,r.bindingContext=i,r.cacheViews&&!r.viewElements&&(r.viewElements=o.childElements),r.model?e.isString(r.model)?e.acquire(r.model).then(function(t){r.model=e.resolveObject(t),y.inject(r)}).fail(function(t){e.error("Failed to load composed module ("+r.model+"). Details: "+t.message)}):y.inject(r):r.view?(r.area=r.area||"partial",r.preserveContext=!0,t.locateView(r.view,r.area,r.viewElements).then(function(e){y.bindAndShow(e,r)})):this.bindAndShow(null,r)}},o.bindingHandlers.compose={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,i,a){var s=y.getSettings(t,e);if(s.mode){var l=o.utils.domData.get(e,x);if(!l){var u=o.virtualElements.childNodes(e);l={},"inline"===s.mode?l.view=r.ensureSingleElement(u):"templated"===s.mode&&(l.parts=p(u)),o.virtualElements.emptyNode(e),o.utils.domData.set(e,x,l)}"inline"===s.mode?s.view=l.view.cloneNode(!0):"templated"===s.mode&&(s.parts=l.parts),s.preserveContext=!0}y.compose(e,s,a,!0)}},o.virtualElements.allowedBindings.compose=!0,y});
define('durandal/events',["durandal/system"],function(e){var t=/\s+/,n=function(){},r=function(e,t){this.owner=e,this.events=t};return r.prototype.then=function(e,t){return this.callback=e||this.callback,this.context=t||this.context,this.callback?(this.owner.on(this.events,this.callback,this.context),this):this},r.prototype.on=r.prototype.then,r.prototype.off=function(){return this.owner.off(this.events,this.callback,this.context),this},n.prototype.on=function(e,n,i){var a,o,s;if(n){for(a=this.callbacks||(this.callbacks={}),e=e.split(t);o=e.shift();)s=a[o]||(a[o]=[]),s.push(n,i);return this}return new r(this,e)},n.prototype.off=function(n,r,i){var a,o,s,l;if(!(o=this.callbacks))return this;if(!(n||r||i))return delete this.callbacks,this;for(n=n?n.split(t):e.keys(o);a=n.shift();)if((s=o[a])&&(r||i))for(l=s.length-2;l>=0;l-=2)r&&s[l]!==r||i&&s[l+1]!==i||s.splice(l,2);else delete o[a];return this},n.prototype.trigger=function(e){var n,r,i,a,o,s,l,u;if(!(r=this.callbacks))return this;for(u=[],e=e.split(t),a=1,o=arguments.length;o>a;a++)u[a-1]=arguments[a];for(;n=e.shift();){if((l=r.all)&&(l=l.slice()),(i=r[n])&&(i=i.slice()),i)for(a=0,o=i.length;o>a;a+=2)i[a].apply(i[a+1]||this,u);if(l)for(s=[n].concat(u),a=0,o=l.length;o>a;a+=2)l[a].apply(l[a+1]||this,s)}return this},n.prototype.proxy=function(e){var t=this;return function(n){t.trigger(e,n)}},n.includeIn=function(e){e.on=n.prototype.on,e.off=n.prototype.off,e.trigger=n.prototype.trigger,e.proxy=n.prototype.proxy},n});
define('durandal/app',["durandal/system","durandal/viewEngine","durandal/composition","durandal/events","jquery"],function(e,t,n,r,i){function a(){return e.defer(function(t){return 0==s.length?(t.resolve(),void 0):(e.acquire(s).then(function(n){for(var r=0;r<n.length;r++){var i=n[r];if(i.install){var a=l[r];e.isObject(a)||(a={}),i.install(a),e.log("Plugin:Installed "+s[r])}else e.log("Plugin:Loaded "+s[r])}t.resolve()}).fail(function(t){e.error("Failed to load plugin(s). Details: "+t.message)}),void 0)}).promise()}var o,s=[],l=[];return o={title:"Application",configurePlugins:function(t,n){var r=e.keys(t);n=n||"plugins/",-1===n.indexOf("/",n.length-1)&&(n+="/");for(var i=0;i<r.length;i++){var a=r[i];s.push(n+a),l.push(t[a])}},start:function(){return e.log("Application:Starting"),this.title&&(document.title=this.title),e.defer(function(t){i(function(){a().then(function(){t.resolve(),e.log("Application:Started")})})}).promise()},setRoot:function(r,i,a){var o,s={activate:!0,transition:i};o=!a||e.isString(a)?document.getElementById(a||"applicationHost"):a,e.isString(r)?t.isViewUrl(r)?s.view=r:s.model=r:s.model=r,n.compose(o,s)}},r.includeIn(o),o});
define('plugins/history',["durandal/system","jquery"],function(e,t){function n(e,t,n){if(n){var r=e.href.replace(/(javascript:|#).*$/,"");e.replace(r+"#"+t)}else e.hash="#"+t}var r=/^[#\/]|\s+$/g,i=/^\/+|\/+$/g,a=/msie [\w.]+/,o=/\/$/,s={interval:50,active:!1};return"undefined"!=typeof window&&(s.location=window.location,s.history=window.history),s.getHash=function(e){var t=(e||s).location.href.match(/#(.*)$/);return t?t[1]:""},s.getFragment=function(e,t){if(null==e)if(s._hasPushState||!s._wantsHashChange||t){e=s.location.pathname+s.location.search;var n=s.root.replace(o,"");e.indexOf(n)||(e=e.substr(n.length))}else e=s.getHash();return e.replace(r,"")},s.activate=function(n){s.active&&e.error("History has already been activated."),s.active=!0,s.options=e.extend({},{root:"/"},s.options,n),s.root=s.options.root,s._wantsHashChange=s.options.hashChange!==!1,s._wantsPushState=!!s.options.pushState,s._hasPushState=!!(s.options.pushState&&s.history&&s.history.pushState);var o=s.getFragment(),l=document.documentMode,u=a.exec(navigator.userAgent.toLowerCase())&&(!l||7>=l);s.root=("/"+s.root+"/").replace(i,"/"),u&&s._wantsHashChange&&(s.iframe=t('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,s.navigate(o,!1)),s._hasPushState?t(window).on("popstate",s.checkUrl):s._wantsHashChange&&"onhashchange"in window&&!u?t(window).on("hashchange",s.checkUrl):s._wantsHashChange&&(s._checkUrlInterval=setInterval(s.checkUrl,s.interval)),s.fragment=o;var c=s.location,d=c.pathname.replace(/[^\/]$/,"$&/")===s.root;if(s._wantsHashChange&&s._wantsPushState){if(!s._hasPushState&&!d)return s.fragment=s.getFragment(null,!0),s.location.replace(s.root+s.location.search+"#"+s.fragment),!0;s._hasPushState&&d&&c.hash&&(this.fragment=s.getHash().replace(r,""),this.history.replaceState({},document.title,s.root+s.fragment+c.search))}return s.options.silent?void 0:s.loadUrl()},s.deactivate=function(){t(window).off("popstate",s.checkUrl).off("hashchange",s.checkUrl),clearInterval(s._checkUrlInterval),s.active=!1},s.checkUrl=function(){var e=s.getFragment();return e===s.fragment&&s.iframe&&(e=s.getFragment(s.getHash(s.iframe))),e===s.fragment?!1:(s.iframe&&s.navigate(e,!1),s.loadUrl(),void 0)},s.loadUrl=function(e){var t=s.fragment=s.getFragment(e);return s.options.routeHandler?s.options.routeHandler(t):!1},s.navigate=function(t,r){if(!s.active)return!1;if(void 0===r?r={trigger:!0}:e.isBoolean(r)&&(r={trigger:r}),t=s.getFragment(t||""),s.fragment!==t){s.fragment=t;var i=s.root+t;if(""===t&&"/"!==i&&(i=i.slice(0,-1)),s._hasPushState)s.history[r.replace?"replaceState":"pushState"]({},document.title,i);else{if(!s._wantsHashChange)return s.location.assign(i);n(s.location,t,r.replace),s.iframe&&t!==s.getFragment(s.getHash(s.iframe))&&(r.replace||s.iframe.document.open().close(),n(s.iframe.location,t,r.replace))}return r.trigger?s.loadUrl(t):void 0}},s.navigateBack=function(){s.history.back()},s});
define('plugins/router',["durandal/system","durandal/app","durandal/activator","durandal/events","durandal/composition","plugins/history","knockout","jquery"],function(e,t,n,r,i,a,o,s){function l(e){return e=e.replace(b,"\\$&").replace(v,"(?:$1)?").replace(m,function(e,t){return t?e:"([^/]+)"}).replace(g,"(.*?)"),new RegExp("^"+e+"$",w?void 0:"i")}function u(e){var t=e.indexOf(":"),n=t>0?t-1:e.length;return e.substring(0,n)}function c(e,t){return-1!==e.indexOf(t,e.length-t.length)}function d(e,t){if(!e||!t)return!1;if(e.length!=t.length)return!1;for(var n=0,r=e.length;r>n;n++)if(e[n]!=t[n])return!1;return!0}function f(e){return e.queryString?e.fragment+"?"+e.queryString:e.fragment}var p,h,v=/\((.*?)\)/g,m=/(\(\?)?:\w+/g,g=/\*\w+/g,b=/[\-{}\[\]+?.,\\\^$|#\s]/g,y=/\/$/,w=!1,k=function(){function i(e,t){return e.router&&e.router.parent==t}function s(e){P&&P.config.isActive&&P.config.isActive(e)}function v(t,n){e.log("Navigation Complete",t,n);var r=e.getModuleId(F);r&&R.trigger("router:navigation:from:"+r),F=t,s(!1),P=n,s(!0);var a=e.getModuleId(F);a&&R.trigger("router:navigation:to:"+a),i(t,R)||R.updateDocumentTitle(t,n),E(!1),h.explicitNavigation=!1,h.navigatingBack=!1,R.trigger("router:navigation:complete",t,n,R)}function m(t,n){e.log("Navigation Cancelled"),R.activeInstruction(P),P&&R.navigate(f(P),!1),E(!1),h.explicitNavigation=!1,h.navigatingBack=!1,R.trigger("router:navigation:cancelled",t,n,R)}function g(t){e.log("Navigation Redirecting"),E(!1),h.explicitNavigation=!1,h.navigatingBack=!1,R.navigate(t,{trigger:!0,replace:!0})}function b(t,n,r){h.navigatingBack=!h.explicitNavigation&&F!=r.fragment,R.trigger("router:route:activating",n,r,R),t.activateItem(n,r.params).then(function(e){if(e){var a=F;if(v(n,r),i(n,R)){var o=r.fragment;r.queryString&&(o+="?"+r.queryString),n.router.loadUrl(o)}a==n&&(R.attached(),R.compositionComplete())}else t.settings.lifecycleData&&t.settings.lifecycleData.redirect?g(t.settings.lifecycleData.redirect):m(n,r);p&&(p.resolve(),p=null)}).fail(function(t){e.error(t)})}function w(t,n,r){var i=R.guardRoute(n,r);i?i.then?i.then(function(i){i?e.isString(i)?g(i):b(t,n,r):m(n,r)}):e.isString(i)?g(i):b(t,n,r):m(n,r)}function x(e,t,n){R.guardRoute?w(e,t,n):b(e,t,n)}function N(e){return P&&P.config.moduleId==e.config.moduleId&&F&&(F.canReuseForRoute&&F.canReuseForRoute.apply(F,e.params)||!F.canReuseForRoute&&F.router&&F.router.loadUrl)}function C(){if(!E()){var t=T.shift();T=[],t&&(E(!0),R.activeInstruction(t),N(t)?x(n.create(),F,t):e.acquire(t.config.moduleId).then(function(n){var r=e.resolveObject(n);x(_,r,t)}).fail(function(n){e.error("Failed to load routed module ("+t.config.moduleId+"). Details: "+n.message)}))}}function D(e){T.unshift(e),C()}function S(e,t,n){for(var r=e.exec(t).slice(1),i=0;i<r.length;i++){var a=r[i];r[i]=a?decodeURIComponent(a):null}var o=R.parseQueryString(n);return o&&r.push(o),{params:r,queryParams:o}}function I(t){R.trigger("router:route:before-config",t,R),e.isRegExp(t)?t.routePattern=t.route:(t.title=t.title||R.convertRouteToTitle(t.route),t.moduleId=t.moduleId||R.convertRouteToModuleId(t.route),t.hash=t.hash||R.convertRouteToHash(t.route),t.routePattern=l(t.route)),t.isActive=t.isActive||o.observable(!1),R.trigger("router:route:after-config",t,R),R.routes.push(t),R.route(t.routePattern,function(e,n){var r=S(t.routePattern,e,n);D({fragment:e,queryString:n,config:t,params:r.params,queryParams:r.queryParams})})}function M(t){if(e.isArray(t.route))for(var n=t.isActive||o.observable(!1),r=0,i=t.route.length;i>r;r++){var a=e.extend({},t);a.route=t.route[r],a.isActive=n,r>0&&delete a.nav,I(a)}else I(t);return R}var F,P,T=[],E=o.observable(!1),_=n.create(),R={handlers:[],routes:[],navigationModel:o.observableArray([]),activeItem:_,isNavigating:o.computed(function(){var e=_(),t=E(),n=e&&e.router&&e.router!=R&&e.router.isNavigating()?!0:!1;return t||n}),activeInstruction:o.observable(null),__router__:!0};return r.includeIn(R),_.settings.areSameItem=function(e,t,n,r){return e==t?d(n,r):!1},R.parseQueryString=function(e){var t,n;if(!e)return null;if(n=e.split("&"),0==n.length)return null;t={};for(var r=0;r<n.length;r++){var i=n[r];if(""!==i){var a=i.split("=");t[a[0]]=a[1]&&decodeURIComponent(a[1].replace(/\+/g," "))}}return t},R.route=function(e,t){R.handlers.push({routePattern:e,callback:t})},R.loadUrl=function(t){var n=R.handlers,r=null,i=t,o=t.indexOf("?");if(-1!=o&&(i=t.substring(0,o),r=t.substr(o+1)),R.relativeToParentRouter){var s=this.parent.activeInstruction();i=s.params.join("/"),i&&"/"==i.charAt(0)&&(i=i.substr(1)),i||(i=""),i=i.replace("//","/").replace("//","/")}i=i.replace(y,"");for(var l=0;l<n.length;l++){var u=n[l];if(u.routePattern.test(i))return u.callback(i,r),!0}return e.log("Route Not Found"),R.trigger("router:route:not-found",t,R),P&&a.navigate(f(P),{trigger:!1,replace:!0}),h.explicitNavigation=!1,h.navigatingBack=!1,!1},R.updateDocumentTitle=function(e,n){n.config.title?document.title=t.title?n.config.title+" | "+t.title:n.config.title:t.title&&(document.title=t.title)},R.navigate=function(e,t){return e&&-1!=e.indexOf("://")?(window.location.href=e,!0):(h.explicitNavigation=!0,a.navigate(e,t))},R.navigateBack=function(){a.navigateBack()},R.attached=function(){R.trigger("router:navigation:attached",F,P,R)},R.compositionComplete=function(){E(!1),R.trigger("router:navigation:composition-complete",F,P,R),C()},R.convertRouteToHash=function(e){if(R.relativeToParentRouter){var t=R.parent.activeInstruction(),n=t.config.hash+"/"+e;return a._hasPushState&&(n="/"+n),n=n.replace("//","/").replace("//","/")}return a._hasPushState?e:"#"+e},R.convertRouteToModuleId=function(e){return u(e)},R.convertRouteToTitle=function(e){var t=u(e);return t.substring(0,1).toUpperCase()+t.substring(1)},R.map=function(t,n){if(e.isArray(t)){for(var r=0;r<t.length;r++)R.map(t[r]);return R}return e.isString(t)||e.isRegExp(t)?(n?e.isString(n)&&(n={moduleId:n}):n={},n.route=t):n=t,M(n)},R.buildNavigationModel=function(t){for(var n=[],r=R.routes,i=t||100,a=0;a<r.length;a++){var o=r[a];o.nav&&(e.isNumber(o.nav)||(o.nav=++i),n.push(o))}return n.sort(function(e,t){return e.nav-t.nav}),R.navigationModel(n),R},R.mapUnknownRoutes=function(t,n){var r="*catchall",i=l(r);return R.route(i,function(o,s){var l=S(i,o,s),u={fragment:o,queryString:s,config:{route:r,routePattern:i},params:l.params,queryParams:l.queryParams};if(t)if(e.isString(t))u.config.moduleId=t,n&&a.navigate(n,{trigger:!1,replace:!0});else if(e.isFunction(t)){var c=t(u);if(c&&c.then)return c.then(function(){R.trigger("router:route:before-config",u.config,R),R.trigger("router:route:after-config",u.config,R),D(u)}),void 0}else u.config=t,u.config.route=r,u.config.routePattern=i;else u.config.moduleId=o;R.trigger("router:route:before-config",u.config,R),R.trigger("router:route:after-config",u.config,R),D(u)}),R},R.reset=function(){return P=F=void 0,R.handlers=[],R.routes=[],R.off(),delete R.options,R},R.makeRelative=function(t){return e.isString(t)&&(t={moduleId:t,route:t}),t.moduleId&&!c(t.moduleId,"/")&&(t.moduleId+="/"),t.route&&!c(t.route,"/")&&(t.route+="/"),t.fromParent&&(R.relativeToParentRouter=!0),R.on("router:route:before-config").then(function(e){t.moduleId&&(e.moduleId=t.moduleId+e.moduleId),t.route&&(e.route=""===e.route?t.route.substring(0,t.route.length-1):t.route+e.route)}),R},R.createChildRouter=function(){var e=k();return e.parent=R,e},R};return h=k(),h.explicitNavigation=!1,h.navigatingBack=!1,h.makeRoutesCaseSensitive=function(){w=!0},h.targetIsThisWindow=function(e){var t=s(e.target).attr("target");return!t||t===window.name||"_self"===t||"top"===t&&window===window.top?!0:!1},h.activate=function(t){return e.defer(function(n){if(p=n,h.options=e.extend({routeHandler:h.loadUrl},h.options,t),a.activate(h.options),a._hasPushState)for(var r=h.routes,i=r.length;i--;){var o=r[i];o.hash=o.hash.replace("#","")}s(document).delegate("a","click",function(e){if(a._hasPushState){if(!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&h.targetIsThisWindow(e)){var t=s(this).attr("href");null==t||"#"===t.charAt(0)||/^[a-z]+:/i.test(t)||(h.explicitNavigation=!0,e.preventDefault(),a.navigate(t))}}else h.explicitNavigation=!0}),a.options.silent&&p&&(p.resolve(),p=null)}).promise()},h.deactivate=function(){a.deactivate()},h.install=function(){o.bindingHandlers.router={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,r,a){var s=o.utils.unwrapObservable(t())||{};if(s.__router__)s={model:s.activeItem(),attached:s.attached,compositionComplete:s.compositionComplete,activate:!1};else{var l=o.utils.unwrapObservable(s.router||r.router)||h;s.model=l.activeItem(),s.attached=l.attached,s.compositionComplete=l.compositionComplete,s.activate=!1}i.compose(e,s,a)}},o.virtualElements.allowedBindings.router=!0},h});
//! moment.js
//! version : 2.6.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.6.0",
        // the global-scope this is NOT the global object in Node.js
        globalScope = typeof global !== 'undefined' ? global : this,
        oldGlobalMoment,
        round = Math.round,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for language config files
        languages = {},

        // moment internal properties
        momentProperties = {
            _isAMomentObject: null,
            _i : null,
            _f : null,
            _l : null,
            _strict : null,
            _isUTC : null,
            _offset : null,  // optional. Combine with _isUTC
            _pf : null,
            _lang : null  // optional
        },

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        parseTokenOrdinal = /\d{1,2}/,

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        function printMsg() {
            if (moment.suppressDeprecationWarnings === false &&
                    typeof console !== 'undefined' && console.warn) {
                console.warn("Deprecation warning: " + msg);
            }
        }
        return extend(function () {
            if (firstTime) {
                printMsg();
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        checkOverflow(config);
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty("toString")) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty("valueOf")) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function cloneMoment(m) {
        var result = {}, i;
        for (i in m) {
            if (m.hasOwnProperty(i) && momentProperties.hasOwnProperty(i)) {
                result[i] = m[i];
            }
        }

        return result;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return  Object.prototype.toString.call(input) === '[object Date]' ||
                input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (inputObject.hasOwnProperty(prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment.fn._lang[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment.fn._lang, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLanguage(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
        Languages
    ************************************/


    extend(Language.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Remove a language from the `languages` cache. Mostly useful in tests.
    function unloadLang(key) {
        delete languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        var i = 0, j, lang, next, split,
            get = function (k) {
                if (!languages[k] && hasModule) {
                    try {
                        require('./lang/' + k);
                    } catch (e) { }
                }
                return languages[k];
            };

        if (!key) {
            return moment.fn._lang;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            lang = get(key);
            if (lang) {
                return lang;
            }
            key = [key];
        }

        //pick the language from the array
        //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        while (i < key.length) {
            split = normalizeLanguage(key[i]).split('-');
            j = split.length;
            next = normalizeLanguage(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                lang = get(split.slice(0, j).join('-'));
                if (lang) {
                    return lang;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return moment.fn._lang;
    }

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {

        if (!m.isValid()) {
            return m.lang().invalidDate();
        }

        format = expandFormat(format, m.lang());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, lang) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return lang.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) { return parseTokenOneDigit; }
            /* falls through */
        case 'SS':
            if (strict) { return parseTokenTwoDigits; }
            /* falls through */
        case 'SSS':
            if (strict) { return parseTokenThreeDigits; }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return getLangDefinition(config._l)._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return parseTokenOrdinal;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
            return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || "";
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(input, 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = getLangDefinition(config._l).isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gg':
        case 'gggg':
        case 'GG':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = input;
            }
            break;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate,
            yearToUse, fixYear, w, temp, lang, weekday, week;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            fixYear = function (val) {
                var intVal = parseInt(val, 10);
                return val ?
                  (val.length < 3 ? (intVal > 68 ? 1900 + intVal : 2000 + intVal) : intVal) :
                  (config._a[YEAR] == null ? moment().weekYear() : config._a[YEAR]);
            };

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
            }
            else {
                lang = getLangDefinition(config._l);
                weekday = w.d != null ?  parseWeekday(w.d, lang) :
                  (w.e != null ?  parseInt(w.e, 10) + lang._week.dow : 0);

                week = parseInt(w.w, 10) || 1;

                //if we're parsing 'd', then the low day numbers may be next week
                if (w.d != null && weekday < lang._week.dow) {
                    week++;
                }

                temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
            }

            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[HOUR] += toInt((config._tzm || 0) / 60);
        input[MINUTE] += toInt((config._tzm || 0) % 60);

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var lang = getLangDefinition(config._l),
            string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, lang).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = extend({}, config);
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be "T" or undefined
                    config._f = isoDates[i][0] + (match[6] || " ");
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += "Z";
            }
            makeDateFromStringAndFormat(config);
        }
        else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromConfig(config);
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, language) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = language.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = cloneMoment(input);

            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = lang;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
            "moment construction falls back to js Date. This is " +
            "discouraged and will be removed in upcoming major " +
            "release. Please refer to " +
            "https://github.com/moment/moment/issues/1407 for more info.",
            function (config) {
        config._d = new Date(config._i);
    });

    // creating with utc
    moment.utc = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = lang;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var r;
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(normalizeLanguage(key), values);
        } else if (values === null) {
            unloadLang(key);
            key = 'en';
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
        return r._abbr;
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null &&  obj.hasOwnProperty('_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {

            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                        (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var sod = makeAs(moment(), this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.lang());
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add((units === 'isoWeek' ? 'week' : units), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = units || 'ms';
            return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
        },

        min: function (other) {
            other = moment.apply(null, arguments);
            return other < this ? this : other;
        },

        max: function (other) {
            other = moment.apply(null, arguments);
            return other > this ? this : other;
        },

        // keepTime = true means only change the timezone, without affecting
        // the local hour. So 5:31:26 +0300 --[zone(2, true)]--> 5:31:26 +0200
        // It is possible that 5:31:26 doesn't exist int zone +0200, so we
        // adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        zone : function (input, keepTime) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    if (!keepTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(offset - input, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this._lang._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.lang().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate("dates accessor is deprecated. Use date instead.", makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate("years accessor is deprecated. Use year instead.", makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang,

        toIsoString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        }
    });

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LANGUAGES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    "Accessing Moment through the global scope is " +
                    "deprecated, and will be removed in an upcoming " +
                    "release.",
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === "function" && define.amd) {
        define("moment", ['require','exports','module'],function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);

define('infrastructure/utils',[],function(){function e(e,t){if(!e||!t)return!1;if(e.length!=t.length)return!1;for(var n=0,r=e.length;r>n;n++)if(e[n]!=t[n])return!1;return!0}function t(e){for(var t=["Bytes","KB","MB","TB"],n=0,r=e;r>1024&&(r/=1024,!(n++>=3)););var i=r.toFixed(2).toLocaleString()+" "+t[n];return i.replace(".00","").replace(".",",")}function n(e,t){return e=e||"",t.length>e.length?!1:e.substring(0,t.length)===t}function r(){return 0===window.location.hash.indexOf("#")?i(window.location.hash.substr(1)):{}}function i(e){var t,n,r,i,o,s,a,u={};if(null===e)return u;t=e.split("&");for(var c=0;c<t.length;c++)n=t[c],r=n.indexOf("="),-1===r?(i=n,o=null):(i=n.substr(0,r),o=n.substr(r+1)),s=decodeURIComponent(i),a=decodeURIComponent(o),u[s]=a;return u}function o(e){var t;"undefined"!=typeof e.access_token&&(t=sessionStorage.state,sessionStorage.removeItem("state"),(null===t||e.state!==t)&&(e.error="invalid_state"))}return{compareArrays:e,formatFileSize:t,stringStartsWith:n,getFragment:r,verifyStateMatch:o}});
define('authentication',["Q","durandal/system","durandal/app","plugins/router","ko","infrastructure/antiForgeryToken","moment","infrastructure/utils"],function(e,n,t,o,r,i,a,s){function u(){var e=s.getFragment();return c().then(function(){return n.defer(function(n){sessionStorage.associatingExternalLogin?j(n,e):"undefined"!=typeof e.error?x(n,e):"undefined"!=typeof e.access_token?R(n,e):l().then(n.resolve)}).promise()})}function c(){return n.defer(function(e){$.ajax("~/api/account/authmetadata",{method:"get"}).then(function(n){_.lockoutPeriod=n.lockoutPeriod,_.minRequiredPasswordLength=n.minRequiredPasswordLength,e.resolve()}).fail(function(t){n.log("getMetadata failed: "+t.message),e.reject(t)})}).promise()}function l(){return n.defer(function(e){$.ajax("~/api/account/userinfo",{method:"get"}).then(function(n){A(new D(n.isAuthenticated,n.userName,n.roles,n)),n.IsAuthenticated&&t.trigger("caps:authentication:loggedOn",A()),e.resolve(A())}).fail(function(t){n.log("getCurrentUser failed: "+t.responseJSON.message),401==t.status?(A(new D(!1)),e.resolve(A())):e.reject(t)})}).promise()}function f(e,t){return n.defer(function(n){$.ajax("~/api/account/managementinfo",{method:"get",data:{returnUrl:e,generateState:t}}).then(function(e){n.resolve(e)}).fail(function(e){n.reject(e)})}).promise()}function d(e,t){return n.defer(function(n){$.ajax("~/api/account/externallogins",{method:"get",data:{returnUrl:e,generateState:t}}).then(n.resolve).fail(n.reject)}).promise()}function g(e){return n.defer(function(n){$.ajax("~/api/account/addexternallogin",{method:"post",data:{externalAccessToken:e}}).then(n.resolve).fail(n.reject)}).promise()}function h(e,t){return n.defer(function(n){$.ajax("~/api/account/removelogin",{method:"post",data:{loginProvider:e,providerKey:t}}).then(n.resolve).fail(n.reject)}).promise()}function m(e){return n.defer(function(n){$.ajax("~/api/account/setpassword",{method:"post",data:e}).then(n.resolve).fail(n.reject)}).promise()}function p(e){return n.defer(function(n){$.ajax("~/api/account/changepassword",{method:"post",data:e}).then(l).then(n.resolve).fail(n.reject)}).promise()}function v(o,r,a){return n.defer(function(s){function u(o){return o.userName&&o.access_token?(k(o.access_token,a),n.log("logon successful"),e.fcall(i.initToken).then(l).then(function(){t.trigger("caps:authentication:loggedOn",A()),s.resolve(o)}).fail(c),void 0):(c(new Error(y(o))),void 0)}function c(e){n.log("logon failed: "+e.message||e.error),s.reject(e)}$.ajax("~/Token?rememberMe="+a,{method:"post",data:{grant_type:"password",UserName:o,Password:r}}).done(u).fail(c)}).promise()}function w(){return n.defer(function(e){$.ajax("~/api/account/logout",{method:"post"}).then(b).then(i.initToken).then(function(){n.log("logoff successful"),t.trigger("caps:authentication:loggedOff"),A(new D),e.resolve()}).fail(e.reject)}).promise()}function j(e,n){var t,o;sessionStorage.removeItem("associatingExternalLogin"),"undefined"!=typeof n.error?(t=null,o=n.error):"undefined"!=typeof n.access_token?(t=n.access_token,o=null):(t=null,o=null),P(),l().then(function(n){n.userName?(window.location.hash="#profile",g(t).then(e.resolve(n))):e.reject()}).fail(e.reject)}function R(n,t){P(),k(t.access_token),e.fcall(i.initToken).then(l).then(function(e){N(),o.redirectFromLogonView(),n.resolve(e)})}function x(e,n){P(),e.reject(new Error(n.error))}function k(e,n){var t=n?localStorage:sessionStorage;t.accessToken=e}function S(){return sessionStorage.accessToken||localStorage.accessToken}function b(){localStorage.removeItem("accessToken"),sessionStorage.removeItem("accessToken")}function N(){var e=localStorage.logonSuccessRoute;e&&(localStorage.removeItem("logonSuccessRoute"),window.location.hash=e)}function P(){window.location.hash="","undefined"!=typeof history.pushState&&history.pushState("",document.title,location.pathname)}function y(e){var n="Die Anmeldung ist fehlgeschlagen. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin besteht.";if(e){var t=e.Error;if(t){if("ERROR_LOCKED"==t){var o="Dein Konto wurde aufgrund zu vieler ungültiger Anmelde-Versuche gesperrt. Die Sperrung wird nach {0} Minuten automatisch aufgehoben.";return o.replace(/\{0\}/gi,_.lockoutPeriod)}if("ERROR_NOTAPPROVED"==t)return"Dein Konto wurde noch nicht bestätigt.";if("ERROR_USER_OR_PASSWORD_INVALID"==t)return"Der Benutzername oder das Passwort sind ungültig.";if("Bad request"==t)return n}}return e.Error||n}function E(){return n.defer(function(e){I()&&!A().isExpired()?e.resolve(A()):A().isExpired()?l().then(e.resolve).fail(e.reject):e.resolve(A())}).promise()}function D(e,n,t,o,i){var a=this;o=o||{},a.expirationTicket=new T(i),a.isAuthenticated=r.observable(e||!1),a.userName=r.observable(n||""),a.roles=r.observable(t||[]),a.creationDate=r.observable(o.creationDate||new Date),a.lastPasswordChangedDate=r.observable(o.lastPasswordChangedDate),a.firstName=r.observable(o.firstName||""),a.lastName=r.observable(o.lastName||""),a.displayName=r.computed(function(){return a.firstName().length>0?a.firstName():a.lastName().length>0?a.lastName():a.userName()}),a.fullName=r.computed(function(){return"{0} {1}".replace(/\{0\}/,a.firstName()).replace(/\{1\}/,a.lastName()).trim()}),a.hasEverChangedPassword=r.computed(function(){return a.lastPasswordChangedDate()>a.creationDate()}),a.isInRole=function(e){for(var n=0;n<this.roles().length;n++)if(a.roles()[n]==e)return!0;return!1},a.isInAnyRole=function(e){if(!e||0===e.length)return!0;for(var n=0;n<e.length;n++)if(a.isInRole(e[n]))return!0;return!1}}function T(e){this.created=new Date,this.expiration=e||!1}var A=r.observable(new D),I=r.computed(function(){return A().isAuthenticated()}),_={lockoutPeriod:15,minRequiredPasswordLength:6},O="viewmodels/login",L="login",q="";return $(document).ajaxSend(function(e,n){var t=S();t&&n.setRequestHeader("Authorization","Bearer "+t)}),o.logon=function(e){if(e.config.moduleId===O)throw new Error("The logon-Function may not be called with the logon-route.");return o.logonSuccessRoute=e,L},o.redirectFromLogonView=function(){var e=q;if(o.logonSuccessRoute){var n=o.logonSuccessRoute;delete o.logonSuccessRoute,e=n.config.hash}o.navigate(e,{trigger:!0,replace:!0})},o.guardRoute=function(e,t){return n.defer(function(e){E().then(function(){I()||t.config.moduleId===O?(t.config.roles&&!A().isInAnyRole(t.config.roles)&&e.resolve("forbidden"),e.resolve(!0)):e.resolve(o.logon(t))}).fail(e.reject)}).promise()},D.prototype.isExpired=function(){return this.expirationTicket.isExpired()},T.prototype.isExpired=function(){return this.expiration?a(this.created).add("seconds",this.expiration)<new Date:!1},{initialize:u,metadata:_,user:A,logon:v,logoff:w,changePassword:p,setPassword:m,isAuthenticated:I,UserModel:D,getAccountManagementInfo:f,getExternalLoginProviders:d,removeLogin:h}});
define('infrastructure/contentControls',[],function(){function e(e,o){return o=o||n,e=e.replace(t,function(e,n,t){return o.call(this,n,e,t)})}function n(e){return'<div class="caps-ccctag">caps:<strong>'+e+"</strong></div>"}var t=/(?:<\s*)caps:([a-zA-Z0-9]*)(?:[^>]*\s*\/>)/gi;return{replaceContentControls:e}});
define('infrastructure/contentEditing',["durandal/app"],function(e){var t={},n={registerEditor:function(e,n,o){t[e]={entityType:e,module:n,edit:o}},findEditor:function(e){return t[e]}};return e.editContent=function(e,t){var o=n.findEditor(e);o&&o.edit(t)},e.registerContentEditor=function(e,t,o){n.registerEditor(e,t,o)},n});
define('infrastructure/contentReferences',["jquery"],function(e){function t(t){this.defaultReplaceOptions=e.extend({replaceFileReference:function(){return""},replacePublicationReference:function(){return""}},t)}function n(e,t,n){this.context=e,this.fileName=t,this.query=n}function r(e,t,n,r){this.context=e,this.id=t,this.language=n,this.query=r}return t.prototype.replaceReferences=function(t,o,i,a){if(a=e.extend(this.defaultReplaceOptions,a),a.replaceFileReference){var s=/caps:\/\/content-file\/([^\"'\s\?)]*)(\?[^\"'\s)]*)?/gi;o=o.replace(s,function(e,r,o,s,c){var u=new n(t,unescape(r),o);return a.replaceFileReference.call(this,u,i,e,s,c)})}if(a.replacePublicationReference){var c=/caps:\/\/publication\/(\d+)(-([a-zA-Z]{2,5}))?(\?[^\"'\s)]*)?/gi;o=o.replace(c,function(e,n,o,s,c,u,l){var f=new r(t,n,s,c);return a.replacePublicationReference.call(this,f,i,e,u,l)})}return o},t});
define('infrastructure/moduleRegistry',["durandal/system","ko"],function(e,t){function n(t){t.routeConfig&&e.log("register module "+t.routeConfig.title),r.push(t)}var r=t.observableArray();return{modules:r,registerModule:n}});
define('entityManagerProvider',["breeze","infrastructure/moduleRegistry"],function(e,t){function n(){var e=a.createEmptyCopy();return e}function r(){for(var e=t.modules(),n=0;n<e.length;n++){var r=e[n].extendModel;r&&"function"==typeof r&&r.call(e[n],a.metadataStore)}return a.fetchMetadata()}function o(){}var i="~/breeze/capsdata",a=new e.EntityManager(i),s={createManager:n,initialize:r,refresh:o};return s});
define('infrastructure/datacontext',["breeze","entityManagerProvider","durandal/system","durandal/app"],function(e,t,n,r){function o(){var e=(new u).from("Websites");return c.executeQuery(e)}function i(e){var t=(new u).from("SiteMaps").where("WebsiteId","==",e);return c.executeQuery(t)}function a(){var e=u.from("Tags");return c.executeQuery(e)}function s(e){return n.defer(function(t){function n(n){if(n.results.length>0)t.resolve(n.results[0]);else{var o=c.createEntity("Tag",{Name:e});c.addEntity(o),c.saveChanges().done(function(){r.trigger("caps:tags:added",o),t.resolve(o)})}}var o=(new u).from("Tags").where("Name","==",e);c.executeQuery(o).then(n).fail(t.reject)}).promise()}var c=t.createManager(),u=e.EntityQuery;return{getWebsites:o,getSiteMaps:i,getTags:a,getOrCreateTag:s}});
define('infrastructure/filterModel',["require","ko"],function(e,t){function n(e,n,r){var o=this;o.name=e,o.title=n,o.value=r,o.isSelected=t.observable(!0),o.toggleSelect=function(){o.isSelected(!o.isSelected())}}function r(e){var n=this;e&&e.length&&e.sort(function(e,t){return e.title.localeCompare(t.title)}),n.filters=t.observableArray(e||[]),n.selectedFilters=t.computed(function(){return t.utils.arrayFilter(n.filters(),function(e){return e.isSelected()})}),n.clear=function(){n.filters([])},n.reset=function(){t.utils.arrayForEach(n.selectedFilters(),function(e){e.isSelected(!1)})},n.showOthers=t.observable(!0),n.toggleShowOthers=function(){n.showOthers(!n.showOthers())},n.allSelected=t.computed({read:function(){for(var e=0;e<n.filters().length;e++)if(!n.filters()[e].isSelected())return!1;return n.showOthers()?!0:!1},write:function(e){t.utils.arrayForEach(n.filters(),function(t){t.isSelected()!==e&&t.isSelected(e)}),n.showOthers(e)}}),n.toggleAll=function(){n.allSelected(!n.allSelected())}}return n.prototype.clone=function(){var e=new n(this.name,this.title,this.value);return e.isSelected(this.isSelected()),e},r.prototype.clone=function(){var e=t.utils.arrayMap(this.filters(),function(e){return e.clone()}),n=new r(e);return n.showOthers(this.showOthers()),n},r.prototype.createOrUpdateFilter=function(e,t,r){var o=this.findFilter(r);o?(o.title=e,o.value=r):(o=new n(t,e,r),this.filters.push(o))},r.prototype.add=function(e){this.filters.push(e),this.filters.sort(function(e,t){return e.title.localeCompare(t.title)})},r.prototype.findFilter=function(e){return t.utils.arrayFirst(this.filters(),function(t){return t.value===e})},r.prototype.toString=function(){if(this.allSelected())return"";for(var e=this.selectedFilters(),t="",n=0;n<e.length;n++){var r=e[n].value;r&&(t+=r+(n<e.length-1?"|":""))}return this.showOthers()&&(t+="|others"),t},{FilterItem:n,FilterOptions:r}});
define('infrastructure/interaction',[],function(){function e(e){this.eventName=e,this.context=null}return e.prototype.trigger=function(){this.context&&this.context.trigger(this.eventName)},e.prototype.attach=function(e){this.context=e},{InteractionRequest:e}});
define('infrastructure/keyCode',[],function(){return{ENTER:13,UP:38,DOWN:40,LEFT:37,RIGHT:39,SPACEBAR:32}});
define('infrastructure/keyboardHandler',["jquery","ko","durandal/system"],function(e,t,n){function r(e){function r(){o.on("keydown",a)}function i(){o.off("keydown",a)}function a(e){n.isFunction(s.keydown)&&s.keydown.call(s,e)}var s=this,c=t.observable(!1);s.activate=function(){c(!0),r()},s.deactivate=function(){c(!1),i()},s.isActive=c,e.on("module:activate",function(){c()&&r()}),e.on("module:deactivate",function(){c()&&i()})}var o=e(window);return r.prototype.keydown=function(e){n.log("Keydown: "+e.keyCode)},r});
define('infrastructure/listSortModel',["require","ko"],function(e,t){function n(e,n,r){var o=this;o.name=e,o.title=n,o.owner=r,o.sort=function(){o.owner&&o.owner.selectedColumn(o)},o.isSelected=t.computed({read:function(){return o.owner&&o.owner.selectedColumn()===o},deferEvaluation:!0})}function r(e,n,r,o){var i=this;i.defaultSortColumn=r||"Created.At",i.defaultSortDirection=o||"desc",e&&e.length&&t.utils.arrayForEach(e,function(e){e.owner=i}),i.columns=e||[],i.selectedColumn=t.observable(),i.sortDirection=t.observable(i.defaultSortDirection);var a=i.columns.length?t.utils.arrayFirst(i.columns,function(e){return e.name===i.defaultSortColumn})||i.columns[0]:null;i.selectedColumn(a),i.toggleSortDirection=function(){i.setSortDirection("desc"==i.sortDirection()?"asc":"desc")},i.sortAsc=function(){i.setSortDirection("asc")},i.sortDesc=function(){i.setSortDirection("desc")},i._callChangeHandler=function(){n&&"function"==typeof n&&n.apply(this)},i.selectedColumn.subscribe(i._callChangeHandler),i.sortDirection.subscribe(i._callChangeHandler)}return r.prototype.setSortDirection=function(e){this.sortDirection()!==e&&(this.sortDirection(e),this._callChangeHandler())},r.prototype.getOrderBy=function(){var e,t=this.selectedColumn();return t&&(e=t.name||this.defaultSortColumn,this.sortDirection()&&"desc"===this.sortDirection().toLowerCase()&&(e+=" desc")),e},{ListColumn:n,SortOptions:r}});
define('localization',["ko"],function(e){function t(e){require(["knockout.validation"],function(t){var n=o[e];n&&t.localize(n)})}function n(e){require(["moment"],function(t){var n=a[e];n&&t.lang(e,n)})}function r(e){this.culture=e}function i(){this.languages=[new r("de"),new r("en")],this.defaultLanguage=this.languages[0]}var o={de:{required:"Dieses Feld ist erforderlich.",min:"Gib einen Wert größer oder gleich {0} ein.",max:"Gib einen Wert kleiner oder gleich {0} ein.",minLength:"Gib mindestens {0} Zeichen ein.",maxLength:"Gib weniger als {0} Zeichen ein.",pattern:"Ungültiger Wert.",step:"Der Wert muss um {0} erhöht werden.",email:"Dies ist keine gültige Email-Adresse.",date:"Dies ist kein gültiges Datum.",dateISO:"Dies ist kein gültiges Datum.",number:"Dies ist keine gültige Nummer.",digit:"Gib eine Zahl ein.",phoneUS:"Gib eine gültige Telefon-Nummer ein.",equal:"Die Werte stimmen nicht überein.",notEqual:"Die Werte dürfen nicht übereinstimmen.",unique:"Dieser Wert wird bereits verwendet."}},a={de:{months:"Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),monthsShort:"Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),weekdays:"Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),weekdaysShort:"So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),weekdaysMin:"So_Mo_Di_Mi_Do_Fr_Sa".split("_"),longDateFormat:{LT:"H:mm U\\hr",L:"DD.MM.YYYY",LL:"D. MMMM YYYY",LLL:"D. MMMM YYYY LT",LLLL:"dddd, D. MMMM YYYY LT"},calendar:{sameDay:"[Heute] H:mm",sameElse:"L",nextDay:"[Morgen] H:mm",nextWeek:"dddd H:mm",lastDay:"[Gestern] H:mm",lastWeek:"[letzten] dddd H:mm"},relativeTime:{future:"in %s",past:"vor %s",s:"ein paar Sekunden",m:"einer Minute",mm:"%d Minuten",h:"einer Stunde",hh:"%d Stunden",d:"einem Tag",dd:"%d Tagen",M:"einem Monat",MM:"%d Monaten",y:"einem Jahr",yy:"%d Jahren"},ordinal:function(){return"."}}},s={de:{de:"Deutsch",en:"German"},en:{de:"Englisch",en:"English"}};r.prototype.localeName=function(e){e=e||this.culture;var t=s[this.culture];return t[e]},i.prototype.supportedTranslations=function(t){return t=(t||this.defaultLanguage.culture).toLowerCase(),e.utils.arrayFilter(this.languages,function(e){return e.culture.toLowerCase()!==t})};var u=new i;return{Language:r,localize:function(e){t(e),n(e)},website:u}});
define('plugins/dialog',["durandal/system","durandal/app","durandal/composition","durandal/activator","durandal/viewEngine","jquery","knockout"],function(e,t,n,r,i,a,o){function s(t){return e.defer(function(n){e.isString(t)?e.acquire(t).then(function(t){n.resolve(e.resolveObject(t))}).fail(function(n){e.error("Failed to load dialog module ("+t+"). Details: "+n.message)}):n.resolve(t)}).promise()}var l,u={},c=0,d=function(e,t,n){this.message=e,this.title=t||d.defaultTitle,this.options=n||d.defaultOptions};return d.prototype.selectOption=function(e){l.close(this,e)},d.prototype.getView=function(){return i.processMarkup(d.defaultViewMarkup)},d.setViewUrl=function(e){delete d.prototype.getView,d.prototype.viewUrl=e},d.defaultTitle=t.title||"Application",d.defaultOptions=["Ok"],d.defaultViewMarkup=['<div data-view="plugins/messageBox" class="modal-content messageBox">','<div class="modal-header">','<h3 data-bind="text: title"></h3>',"</div>",'<div class="modal-body">','<p class="message" data-bind="text: message"></p>',"</div>",'<div class="modal-footer" data-bind="foreach: options">','<button class="btn btn-default" data-bind="click: function () { $parent.selectOption($data); }, text: $data, css: { \'btn-primary\': $index() == 0, autofocus: $index() == 0 }"></button>',"</div>","</div>"].join("\n"),l={MessageBox:d,currentZIndex:1050,getNextZIndex:function(){return++this.currentZIndex},isOpen:function(){return c>0},getContext:function(e){return u[e||"default"]},addContext:function(e,t){t.name=e,u[e]=t;var n="show"+e.substr(0,1).toUpperCase()+e.substr(1);this[n]=function(t,n){return this.show(t,n,e)}},createCompositionSettings:function(e,t){var n={model:e,activate:!1,transition:!1};return t.attached&&(n.attached=t.attached),t.compositionComplete&&(n.compositionComplete=t.compositionComplete),n},getDialog:function(e){return e?e.__dialog__:void 0},close:function(e){var t=this.getDialog(e);if(t){var n=Array.prototype.slice.call(arguments,1);t.close.apply(t,n)}},show:function(t,i,a){var o=this,l=u[a||"default"];return e.defer(function(e){s(t).then(function(t){var a=r.create();a.activateItem(t,i).then(function(r){if(r){var i=t.__dialog__={owner:t,context:l,activator:a,close:function(){var n=arguments;a.deactivateItem(t,!0).then(function(r){r&&(c--,l.removeHost(i),delete t.__dialog__,0===n.length?e.resolve():1===n.length?e.resolve(n[0]):e.resolve.apply(e,n))})}};i.settings=o.createCompositionSettings(t,l),l.addHost(i),c++,n.compose(i.host,i.settings)}else e.resolve(!1)})})}).promise()},showMessage:function(t,n,r){return e.isString(this.MessageBox)?l.show(this.MessageBox,[t,n||d.defaultTitle,r||d.defaultOptions]):l.show(new this.MessageBox(t,n,r))},install:function(e){t.showDialog=function(e,t,n){return l.show(e,t,n)},t.showMessage=function(e,t,n){return l.showMessage(e,t,n)},e.messageBox&&(l.MessageBox=e.messageBox),e.messageBoxView&&(l.MessageBox.prototype.getView=function(){return e.messageBoxView})}},l.addContext("default",{blockoutOpacity:.2,removeDelay:200,addHost:function(e){var t=a("body"),n=a('<div class="modalBlockout"></div>').css({"z-index":l.getNextZIndex(),opacity:this.blockoutOpacity}).appendTo(t),r=a('<div class="modalHost"></div>').css({"z-index":l.getNextZIndex()}).appendTo(t);if(e.host=r.get(0),e.blockout=n.get(0),!l.isOpen()){e.oldBodyMarginRight=t.css("margin-right"),e.oldInlineMarginRight=t.get(0).style.marginRight;var i=a("html"),o=t.outerWidth(!0),s=i.scrollTop();a("html").css("overflow-y","hidden");var u=a("body").outerWidth(!0);t.css("margin-right",u-o+parseInt(e.oldBodyMarginRight,10)+"px"),i.scrollTop(s)}},removeHost:function(e){if(a(e.host).css("opacity",0),a(e.blockout).css("opacity",0),setTimeout(function(){o.removeNode(e.host),o.removeNode(e.blockout)},this.removeDelay),!l.isOpen()){var t=a("html"),n=t.scrollTop();t.css("overflow-y","").scrollTop(n),e.oldInlineMarginRight?a("body").css("margin-right",e.oldBodyMarginRight):a("body").css("margin-right","")}},attached:function(e){a(e).css("visibility","hidden")},compositionComplete:function(e,t,n){var r=l.getDialog(n.model),i=a(e),o=i.find("img").filter(function(){var e=a(this);return!(this.style.width&&this.style.height||e.attr("width")&&e.attr("height"))});i.data("predefinedWidth",i.get(0).style.width);var s=function(){setTimeout(function(){i.data("predefinedWidth")||i.css({width:""});var e=i.outerWidth(!1),t=i.outerHeight(!1),n=a(window).height(),o=Math.min(t,n);i.css({"margin-top":(-o/2).toString()+"px","margin-left":(-e/2).toString()+"px"}),i.data("predefinedWidth")||i.outerWidth(e),t>n?i.css("overflow-y","auto"):i.css("overflow-y",""),a(r.host).css("opacity",1),i.css("visibility","visible"),i.find(".autofocus").first().focus()},1)};s(),o.load(s),i.hasClass("autoclose")&&a(r.blockout).click(function(){r.close()})}}),l});
define('infrastructure/moduleFactory',["ko","plugins/dialog","durandal/events"],function(e,t,n){function r(t){t.hasUnsavedChanges=t.hasUnsavedChanges||e.observable(!1);var r=new i(t);return n.includeIn(r),t.hasLongRunningTasks=e.computed({read:function(){return r.hasLongRunningTasks()},deferEvaluation:!0}),t.taskInfo=e.computed({read:function(){return r.taskInfo()},deferEvaluation:!0}),r}function i(e){this.routeConfig=e,this.dialogContext=void 0}return i.prototype.activate=function(){this.trigger("module:activate",this)},i.prototype.deactivate=function(){this.trigger("module:deactivate",this)},i.prototype.initializeRouter=function(){},i.prototype.getDialogContextName=function(){return this.moduleName+"_DialogContext"},i.prototype.initializeDialogContext=function(){var n=this,r="#"+n.moduleName+"Module";this.dialogContext={addHost:function(e){var t=$(r),n=t.children(":visible"),i=$('<div class="pageDialogHost"></div>').appendTo(t);e.host=i.get(0),e.hiddenControls=n,n.hide(),i.show()},removeHost:function(t){var n=($(r),$(t.host));n.hide(),t.hiddenControls.show(),setTimeout(function(){e.removeNode(t.host)},200)},compositionComplete:function(){}},t.addContext(this.getDialogContextName(),this.dialogContext)},i.prototype.showDialog=function(e,n){return this.dialogContext||this.initializeDialogContext(),t.show(e,n,this.getDialogContextName())},i.prototype.hasLongRunningTasks=function(){return!1},i.prototype.taskInfo=function(){return{count:0,progress:0}},{createModule:r,CapsModule:i}});
define('infrastructure/moduleLoader',["durandal/system","./moduleRegistry","Q"],function(e,t,n){function r(e){return"modules/"+e+"/module"}return{loadModules:function(t){var r,i=[];if(e.isArray(t))for(var o=0;o<t.length;o++)r=this.loadModule(t[o]),r&&i.push(r);else e.isString(t)&&(r=this.loadModule(t),r&&i.push(r));return n.all(i)},loadModule:function(n){if(!e.isString(n))throw new Error("The parameter name has to be a string.");return require([r(n)],function(e){e.moduleName=n,t.registerModule(e)})}}});
define('infrastructure/moduleRouter',["plugins/router","durandal/system","infrastructure/moduleRegistry","ko","infrastructure/utils","durandal/composition"],function(e,t,n,r,o,i){function a(e){return r.utils.arrayForEach(n.modules(),function(t){s(e,t)}),e}function s(e,n){var r=n.routeConfig;if(!r)throw new Error("No moduleRoute found.");r.isModuleRoute=!0,e.map(r),t.isFunction(n.initializeRouter)&&n.initializeRouter()}function u(t,n,r){var o=e.createChildRouter().makeRelative({moduleId:n,route:r});return c(o,t),o.on("router:navigation:complete",function(e,n,r){i.current.complete(function(){t.trigger("module:compositionComplete",t,e,n,r)})}),o}function c(e,n){e.activeItem.settings.areSameItem=function(n,r,i,a){return n==r||t.getModuleId(n)==t.getModuleId(r)?n&&t.isFunction(n.shouldActivate)?!n.shouldActivate(e,i,a):o.compareArrays(i,a):!1},e.navigateToModule=function(){var t=e.activeInstruction();null==t?e.navigate(n.routeConfig.hash):e.navigate(t.fragment)}}return{mapModuleRoutes:a,createModuleRouter:u}});
define('infrastructure/publicationService',["durandal/system","durandal/app","entityManagerProvider","breeze","ko"],function(e,t,n,r,i){function o(){var e=this;e.manager=n.createManager()}function a(t,n){return e.defer(function(e){var r=(new s).from("SiteMapNodes").where("Id","==",n).expand("Resources, Content");t.executeQuery(r).then(function(t){e.resolve(t.results[0])}).fail(e.reject)}).promise()}var s=r.EntityQuery;return o.prototype.publish=function(n,r,o){var a=this;return e.defer(function(e){var u=(new s).from("SiteMaps").where("Id","==",n).expand("SiteMapNodes");a.manager.executeQuery(u).then(function(s){var u=s.results[0],c=i.utils.arrayFirst(u.SiteMapNodes(),function(e){return e.Id()===r}),l=c?c.maxChildNodeRanking()+1:0,d=a.manager.createEntity("DbSiteMapNode",{NodeType:"PAGE",Name:o.name,Ranking:l});a.manager.addEntity(d),d.SiteMapId(n),c&&d.ParentNodeId(c.Id()),a.createResources(d,o);var f=a.createPublication(o,a.manager);d.ContentId(f.Id()),a.manager.saveChanges().then(function(){t.trigger("caps:publication:created",d),e.resolve(d)}).fail(e.reject)})}).promise()},o.prototype.setNodeContent=function(n,r){var i=this;return e.defer(function(e){a(i.manager,n).then(function(n){n.Content()&&n.Content().setDeleted();var o=i.createPublication(r);n.ContentId(o.Id()),i.manager.saveChanges().then(function(){t.trigger("caps:publication:refreshed",n),e.resolve(n)}).fail(e.reject)})}).promise()},o.prototype.createTeaser=function(n,r,o){var a=this;return e.defer(function(e){var u=(new s).from("SiteMaps").where("Id","==",n).expand("SiteMapNodes.Resources");a.manager.executeQuery(u).then(function(s){var u=s.results[0],c=i.utils.arrayFirst(u.SiteMapNodes(),function(e){return e.Id()===r}),l=c?c.maxChildNodeRanking()+1:0,d=i.utils.arrayFirst(u.SiteMapNodes(),function(e){return e.Id()===o});a.contentFromNode(d).then(function(r){var i=a.manager.createEntity("DbSiteMapNode",{NodeType:"TEASER",Name:d.Name(),Ranking:l,Redirect:d.PermanentId()});a.manager.addEntity(i),i.SiteMapId(n),c&&i.ParentNodeId(c.Id()),a.createResources(i,r);var o=a.createPublication(r,a.manager);i.ContentId(o.Id()),a.manager.saveChanges().then(function(){t.trigger("caps:publication:created",i),e.resolve(i)}).fail(e.reject)})})}).promise()},o.prototype.contentFromNode=function(t){var n=this;return e.defer(function(e){var r=(new s).from("Publications").where("Id","==",t.ContentId()).expand("Translations, ContentParts.Resources, Files.Resources.FileVersion.File");n.manager.executeQuery(r).then(function(n){var r=n.results[0];e.resolve(r.generateContentData(t))}).fail(e.reject)}).promise()},o.prototype.createResources=function(e,t){var n=this;i.utils.arrayForEach(t.resources,function(t){var r=e.getOrCreateResource(t.language,n.manager);r.Title(t.title),r.Description(t.description),r.Keywords(t.keywords)})},o.prototype.createPublication=function(e){var t=this,n=t.manager.createEntity("Publication",{EntityType:e.entityType,EntityKey:e.entityId,ContentVersion:e.version,ContentDate:new Date,AuthorName:e.modified.by,Template:e.template});return t.manager.addEntity(n),i.utils.arrayForEach(e.contentParts,function(e){var r=n.getOrCreateContentPart(e.name,t.manager);r.ContentType(e.contentType),r.Ranking(e.ranking),i.utils.arrayForEach(e.resources,function(e){var n=r.getOrCreateResource(e.language,t.manager);n.Content(e.content)})}),i.utils.arrayForEach(e.files,function(e){var r=t.manager.createEntity("PublicationFile",{PublicationId:n.Id()});t.manager.addEntity(r),r.Name(e.name),r.IsEmbedded(e.isEmbedded),r.Determination(e.determination),r.Group(e.group),r.Ranking(e.ranking),i.utils.arrayForEach(e.resources,function(e){var n=r.getOrCreateResource(e.language,t.manager);n.DbFileVersionId(e.dbFileVersionId),n.Title(e.title),n.Description(e.description),n.Credits(e.credits)})}),n},o.prototype.republish=function(n,r){var i=this;return e.defer(function(e){a(i.manager,n).then(function(n){i.createResources(n,r),n.Content().setDeleted();var o=i.createPublication(r);n.ContentId(o.Id()),i.manager.saveChanges().then(function(){t.trigger("caps:publication:refreshed",n),e.resolve(n)}).fail(e.reject)})}).promise()},{publish:function(e,t){var n=new o;return n.publish(t.SiteMapId(),t.Id(),e)},republish:function(e,t){var n=new o;return n.republish(e,t)},createTeaser:function(e,t,n){var r=new o;return r.createTeaser(e,t,n)},setNodeContent:function(e,t){var n=new o;return n.setNodeContent(e,t)}}});
define('infrastructure/screen',["jquery"],function(e){function t(){return n.width()<=480}var n=e(window);return{isPhone:t}});
define('infrastructure/scrollState',["ko","durandal/composition"],function(e,t){function n(n){var r=this,i=e.observable(!1),o=e.observable(!0);r.scrollTop=e.observable(),r.isActive=i,r.isEnabled=e.computed(function(){return i()&&o()}),r.activate=function(){i(!0)},r.deactivate=function(){i(!1)},n.on("module:activate",function(){i()&&t.current.complete(function(){o(!0)})}),n.on("module:deactivate",function(){i()&&o(!1)})}return n});
define('infrastructure/searchGrammer',[],function(){var e={trace:function(){},yy:{},symbols_:{error:2,expressions:3,QRY:4,EOF:5,EXPR:6,T:7,AND:8,OR:9,SEARCHTERM:10,":":11,"(":12,")":13,$accept:0,$end:1},terminals_:{2:"error",5:"EOF",8:"AND",9:"OR",10:"SEARCHTERM",11:":",12:"(",13:")"},productions_:[0,[3,2],[4,1],[4,2],[6,1],[6,2],[6,2],[7,1],[7,3],[7,3]],performAction:function(e,t,n,r,i,o){var s=o.length-1;switch(i){case 1:return o[s-1];case 2:this.$=new r.Query(o[s]);break;case 3:o[s-1].nodes.push(o[s]);break;case 4:this.$=new r.AndExpression(o[s]);break;case 5:this.$=new r.AndExpression(o[s]);break;case 6:this.$=new r.OrExpression(o[s]);break;case 7:this.$=new r.SearchTerm(o[s]);break;case 8:this.$=new r.SearchTerm(o[s],o[s-2]);break;case 9:this.$=o[s-1]}},table:[{3:1,4:2,6:3,7:4,8:[1,5],9:[1,6],10:[1,7],12:[1,8]},{1:[3]},{5:[1,9],6:10,7:4,8:[1,5],9:[1,6],10:[1,7],12:[1,8]},{5:[2,2],8:[2,2],9:[2,2],10:[2,2],12:[2,2],13:[2,2]},{5:[2,4],8:[2,4],9:[2,4],10:[2,4],12:[2,4],13:[2,4]},{7:11,10:[1,7],12:[1,8]},{7:12,10:[1,7],12:[1,8]},{5:[2,7],8:[2,7],9:[2,7],10:[2,7],11:[1,13],12:[2,7],13:[2,7]},{4:14,6:3,7:4,8:[1,5],9:[1,6],10:[1,7],12:[1,8]},{1:[2,1]},{5:[2,3],8:[2,3],9:[2,3],10:[2,3],12:[2,3],13:[2,3]},{5:[2,5],8:[2,5],9:[2,5],10:[2,5],12:[2,5],13:[2,5]},{5:[2,6],8:[2,6],9:[2,6],10:[2,6],12:[2,6],13:[2,6]},{10:[1,15]},{6:10,7:4,8:[1,5],9:[1,6],10:[1,7],12:[1,8],13:[1,16]},{5:[2,8],8:[2,8],9:[2,8],10:[2,8],12:[2,8],13:[2,8]},{5:[2,9],8:[2,9],9:[2,9],10:[2,9],12:[2,9],13:[2,9]}],defaultActions:{9:[2,1]},parseError:function(e,t){if(!t.recoverable)throw new Error(e);this.trace(e)},parse:function(e){function t(){var e;return e=n.lexer.lex()||d,"number"!=typeof e&&(e=n.symbols_[e]||e),e}var n=this,r=[0],i=[null],o=[],s=this.table,a="",u=0,c=0,l=0,h=2,d=1,f=o.slice.call(arguments,1);this.lexer.setInput(e),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,this.yy.parser=this,"undefined"==typeof this.lexer.yylloc&&(this.lexer.yylloc={});var g=this.lexer.yylloc;o.push(g);var p=this.lexer.options&&this.lexer.options.ranges;this.parseError="function"==typeof this.yy.parseError?this.yy.parseError:Object.getPrototypeOf(this).parseError;for(var m,y,v,_,b,w,k,x,S,E={};;){if(v=r[r.length-1],this.defaultActions[v]?_=this.defaultActions[v]:((null===m||"undefined"==typeof m)&&(m=t()),_=s[v]&&s[v][m]),"undefined"==typeof _||!_.length||!_[0]){var C="";S=[];for(w in s[v])this.terminals_[w]&&w>h&&S.push("'"+this.terminals_[w]+"'");C=this.lexer.showPosition?"Parse error on line "+(u+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+S.join(", ")+", got '"+(this.terminals_[m]||m)+"'":"Parse error on line "+(u+1)+": Unexpected "+(m==d?"end of input":"'"+(this.terminals_[m]||m)+"'"),this.parseError(C,{text:this.lexer.match,token:this.terminals_[m]||m,line:this.lexer.yylineno,loc:g,expected:S})}if(_[0]instanceof Array&&_.length>1)throw new Error("Parse Error: multiple actions possible at state: "+v+", token: "+m);switch(_[0]){case 1:r.push(m),i.push(this.lexer.yytext),o.push(this.lexer.yylloc),r.push(_[1]),m=null,y?(m=y,y=null):(c=this.lexer.yyleng,a=this.lexer.yytext,u=this.lexer.yylineno,g=this.lexer.yylloc,l>0&&l--);break;case 2:if(k=this.productions_[_[1]][1],E.$=i[i.length-k],E._$={first_line:o[o.length-(k||1)].first_line,last_line:o[o.length-1].last_line,first_column:o[o.length-(k||1)].first_column,last_column:o[o.length-1].last_column},p&&(E._$.range=[o[o.length-(k||1)].range[0],o[o.length-1].range[1]]),b=this.performAction.apply(E,[a,c,u,this.yy,_[1],i,o].concat(f)),"undefined"!=typeof b)return b;k&&(r=r.slice(0,2*-1*k),i=i.slice(0,-1*k),o=o.slice(0,-1*k)),r.push(this.productions_[_[1]][0]),i.push(E.$),o.push(E._$),x=s[r[r.length-2]][r[r.length-1]],r.push(x);break;case 3:return!0}}return!0}},t=function(){var e={EOF:1,parseError:function(e,t){if(!this.yy.parser)throw new Error(e);this.yy.parser.parseError(e,t)},setInput:function(e){return this._input=e,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},input:function(){var e=this._input[0];this.yytext+=e,this.yyleng++,this.offset++,this.match+=e,this.matched+=e;var t=e.match(/(?:\r\n?|\n).*/g);return t?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),e},unput:function(e){var t=e.length,n=e.split(/(?:\r\n?|\n)/g);this._input=e+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-t-1),this.offset-=t;var r=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),n.length-1&&(this.yylineno-=n.length-1);var i=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:n?(n.length===r.length?this.yylloc.first_column:0)+r[r.length-n.length].length-n[0].length:this.yylloc.first_column-t},this.options.ranges&&(this.yylloc.range=[i[0],i[0]+this.yyleng-t]),this.yyleng=this.yytext.length,this},more:function(){return this._more=!0,this},reject:function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},less:function(e){this.unput(this.match.slice(e))},pastInput:function(){var e=this.matched.substr(0,this.matched.length-this.match.length);return(e.length>20?"...":"")+e.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var e=this.match;return e.length<20&&(e+=this._input.substr(0,20-e.length)),(e.substr(0,20)+(e.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var e=this.pastInput(),t=new Array(e.length+1).join("-");return e+this.upcomingInput()+"\n"+t+"^"},test_match:function(e,t){var n,r,i;if(this.options.backtrack_lexer&&(i={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(i.yylloc.range=this.yylloc.range.slice(0))),r=e[0].match(/(?:\r\n?|\n).*/g),r&&(this.yylineno+=r.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:r?r[r.length-1].length-r[r.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+e[0].length},this.yytext+=e[0],this.match+=e[0],this.matches=e,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(e[0].length),this.matched+=e[0],n=this.performAction.call(this,this.yy,this,t,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),n)return n;if(this._backtrack){for(var o in i)this[o]=i[o];return!1}return!1},next:function(){if(this.done)return this.EOF;this._input||(this.done=!0);var e,t,n,r;this._more||(this.yytext="",this.match="");for(var i=this._currentRules(),o=0;o<i.length;o++)if(n=this._input.match(this.rules[i[o]]),n&&(!t||n[0].length>t[0].length)){if(t=n,r=o,this.options.backtrack_lexer){if(e=this.test_match(n,i[o]),e!==!1)return e;if(this._backtrack){t=!1;continue}return!1}if(!this.options.flex)break}return t?(e=this.test_match(t,i[r]),e!==!1?e:!1):""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){var e=this.next();return e?e:this.lex()},begin:function(e){this.conditionStack.push(e)},popState:function(){var e=this.conditionStack.length-1;return e>0?this.conditionStack.pop():this.conditionStack[0]},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},topState:function(e){return e=this.conditionStack.length-1-Math.abs(e||0),e>=0?this.conditionStack[e]:"INITIAL"},pushState:function(e){this.begin(e)},stateStackSize:function(){return this.conditionStack.length},options:{},performAction:function(e,t,n,r){switch(n){case 0:break;case 1:return 8;case 2:return 9;case 3:return 10;case 4:return 12;case 5:return 13;case 6:return 11;case 7:return 5}},rules:[/^(?:\s+)/,/^(?:(UND|und|and|AND|\+))/,/^(?:(ODER|oder|or|OR|\|))/,/^(?:\w+)/,/^(?:\()/,/^(?:\))/,/^(?::)/,/^(?:$)/],conditions:{INITIAL:{rules:[0,1,2,3,4,5,6,7],inclusive:!0}}};return e}();return e.lexer=t,e});
define('infrastructure/tagService',["require","durandal/app","knockout","Q","infrastructure/datacontext","authentication"],function(e,t,n,r,i,o){function s(e){var t=e.toLowerCase();return n.utils.arrayFirst(l(),function(e){return e.Name().toLowerCase()===t})}function a(e){return n.utils.arrayFirst(l(),function(t){return t.Id()===e})}function u(e){var t=r.defer(),n=s(e);return n?t.resolve(n):i.getOrCreateTag(e).fail(t.reject).done(function(e){l.push(e),t.resolve(e)}),t.promise}function c(){return o.isAuthenticated()?i.getTags().fail(function(e){console.log("Tags could not be refreshed. "+e.message)}).done(function(e){e&&e.results&&l(e.results)}):void 0}var l=n.observableArray([]);return t.on("caps:authentication:loggedOn",function(){c()}),t.on("caps:tag:deleted",function(e){var t=a(e.Id());t&&l.remove(t)}),o.isAuthenticated()&&c(),{tags:l,findTagByName:s,findTagById:a,getOrCreateTag:u,refreshTags:c}});
define('infrastructure/treeViewModel',["ko","infrastructure/interaction","infrastructure/keyCode","durandal/events"],function(e,t,n,r){function i(){var t=this;t.keyName=e.observable(),t.selectedNode=e.observable(),t.root=new o(t),t.root.isExpanded(!0),t.rootNodes=e.computed(function(){return t.root.childNodes()}),t.selectedKey=e.computed(function(){return t.selectedNode()?t.selectedNode().key():void 0}),r.includeIn(t)}function o(n,r){var i=this;i.childNodes=e.observableArray(),i.parentNode=e.observable(r),i.tree=n,i.entity=e.observable(),i.key=e.computed({read:function(){var e=n.keyName();if(e&&i.entity()&&i.entity()[e]){var t=i.entity()[e];return"function"==typeof t?t.call(i.entity()):t}return void 0},deferEvaluation:!0}),i.isSelected=e.computed({read:function(){return i.tree&&i.tree.selectedNode()===i},deferEvaluation:!0}),i.isExpanded=e.observable(!1),i.addChildNode=function(e){i.childNodes.push(e),e.parentNode(i)},i.detachFromParentNode=function(){if(i.isSelected()){var e=i.nextSibling()||i.previousSibling()||i.parentNode();e&&e!==i.tree.root?e.selectNode():i.tree.selectedNode(null)}i.parentNode().childNodes.remove(i),i.parentNode(null)},i.hasChildNodes=e.computed(function(){return i.childNodes()&&i.childNodes().length}),i.siblings=e.computed({read:function(){var e=i.parentNode()?i.parentNode().childNodes():i.tree?i.tree.rootNodes():[i];return e},deferEvaluation:!0}),i.nextSibling=e.computed({read:function(){var e=i.siblings(),t=e.indexOf(i);return t<e.length-1?e[t+1]:null},deferEvaluation:!0}),i.previousSibling=e.computed({read:function(){var e=i.siblings(),t=e.indexOf(i);return t>0?e[t-1]:null},deferEvaluation:!0}),i.scrollIntoViewRequest=new t.InteractionRequest("ScrollIntoView")}function s(e){var t=this,n=t.siblings().slice(0),r=n.indexOf(t),i=r+(e>=0?1:-1);if(i>=0&&i<n.length){n.splice(r,1),n.splice(i,0,t);var o=t.parentNode()||(t.tree?t.tree.root():void 0);o&&(o.childNodes(n),t.tree&&t.tree.trigger("tree:nodeMoved",t))}}return i.prototype.clear=function(){this.root.childNodes.removeAll()},i.prototype.createNode=function(){return new o(this)},i.prototype.saveState=function(){var t=[];return e.utils.arrayForEach(this.rootNodes(),function(e){e.saveState(t)}),{selectedKey:this.selectedKey(),nodeState:t}},i.prototype.restoreState=function(t){var n=this;if(e.utils.arrayForEach(t.nodeState,function(e){var t=n.findNodeByKey(e.key);t&&t.restoreState(e)}),null!==t.selectedKey&&void 0!==t.selectedKey){var r=n.findNodeByKey(t.selectedKey);n.selectedNode(r)}},i.prototype.findNodeByKey=function(e){function t(n){if(n&&n.length)for(var r=0;r<n.length;r++){var i=n[r];if(i.key()===e)return i;var o=t(i.childNodes());if(o)return o}return void 0}return t(this.rootNodes())},i.prototype.selectNodeByKey=function(e){var t=this.findNodeByKey(e);return t?(t.selectNode(),!0):!1},i.prototype.expandRootNodes=function(){e.utils.arrayForEach(this.rootNodes(),function(e){e.isExpanded(!0)})},i.prototype.selectRootNode=function(){this.rootNodes().length&&this.selectedNode(this.rootNodes()[0])},i.prototype.handleKeyDown=function(e){function t(e){return e===n.UP||e===n.DOWN||e===n.LEFT||e===n.RIGHT}function r(e){if(e.hasChildNodes()&&e.isExpanded())a(e);else{if(l(e))return;e.parentNode()&&l(e.parentNode())}}function i(e){var t=e.previousSibling();t&&t.hasChildNodes()&&t.isExpanded()?u(t):d(e)||c(e)}function o(e){e.hasChildNodes()&&e.isExpanded()&&e.isExpanded(!1)}function s(e){e.hasChildNodes()&&!e.isExpanded()&&e.isExpanded(!0)}function a(e){if(e.hasChildNodes()){var t=e.childNodes()[0];return h.selectedNode(t),!0}return!1}function u(e){if(e.hasChildNodes()){var t=e.childNodes()[e.childNodes().length-1];return h.selectedNode(t),!0}return!1}function c(e){return e.parentNode()&&e.parentNode()!==h.root?(h.selectedNode(e.parentNode()),!0):!1}function l(e){var t=e.nextSibling();return t?(h.selectedNode(t),!0):!1}function d(e){var t=e.previousSibling();return t?(h.selectedNode(t),!0):!1}var h=this;if(t(e.keyCode)){if(e.preventDefault(),!h.selectedNode())return h.selectRootNode(),void 0;var f=h.selectedNode();e.keyCode===n.DOWN&&r(f),e.keyCode===n.UP&&i(f),e.keyCode===n.LEFT&&o(f),e.keyCode===n.RIGHT&&s(f),h.selectedNode()&&h.selectedNode().ensureVisible()}e.keyCode===n.SPACEBAR&&h.selectedNode()&&(e.preventDefault(),h.selectedNode().toggleIsExpanded())},o.prototype.scrollIntoView=function(){this.scrollIntoViewRequest.trigger()},o.prototype.selectNode=function(){this.tree.selectedNode(this),this.ensureVisible()},o.prototype.toggleIsExpanded=function(){var e=!this.isExpanded();this.isExpanded(e)},o.prototype.saveState=function(t){t.push({key:this.key(),isExpanded:this.isExpanded()}),e.utils.arrayForEach(this.childNodes(),function(e){e.saveState(t)})},o.prototype.restoreState=function(e){e&&this.isExpanded(e.isExpanded)},o.prototype.ensureVisible=function(){for(var e=this,t=this.parentNode();t;)t.isExpanded()||t.isExpanded(!0),t=t.parentNode();e.scrollIntoView()},o.prototype.moveUp=function(){var e=this;s.call(e,-1)},o.prototype.moveDown=function(){var e=this;s.call(e,1)},{TreeViewModel:i,TreeNodeViewModel:o}});
define('infrastructure/urlHelper',["infrastructure/serverUtil"],function(e){function t(){}return t.prototype.getFileUrl=function(t,n,r){if(n){if(/(\?|&amp;|&)download=1/i.test(r)||!n.File().isImage())return e.mapPath("~/DbFileContent/Download/"+n.Id());if(n.File().isImage()){if(/(\?|&amp;|&)size=([0-9]+x[0-9]+)/i.test(r)){var i="220x160",o=r.match(/(\?|&amp;|&)size=([0-9]+x[0-9]+)/);return o&&3==o.length&&(i=o[2]),e.mapPath("~/DbFileContent/Thumbnail/"+n.Id()+"?thumbnailName="+i)}return e.mapPath("~/DbFileContent/Inline/"+n.Id())}}return""},t.prototype.getPublicationUrl=function(e){return"#sitemap?p="+e},new t});
define('infrastructure/userQueryParser',["breeze","./searchGrammer"],function(e,t){function n(){}function r(e){this.child=e,this.type="AndExpression"}function i(e){this.child=e,this.type="OrExpression"}function o(e){this.nodes=[],this.nodes.push(e),this.type="Query"}function s(e,t){this.value=e,this.type="SearchTerm",this.col=t}function a(e){try{return t.parse(e)}catch(n){return console.log("validateUserQuery failed. "+n.message),null}}function u(t,n){function r(t){switch(t.type){case"Query":return t.getPredicates();case"SearchTerm":return new e.Predicate(n.translateColumnName(t.col),"contains",t.value)}return null}if(!t.nodes.length)return null;for(var i,o=0;o<t.nodes.length;o++){var s=t.nodes[o],a=r(s.child);switch(s.type){case"AndExpression":i=i?i.and(a):a;break;case"OrExpression":i=i?i.or(a):a}}return i}return n.prototype.translateColumnName=function(e){return e},n.prototype.getBreezePredicate=function(e){if(e&&e.length){var t=a(e);if(t)return u(t,this)}return null},n.prototype.validate=function(e){return null!==a(e)},t.yy={AndExpression:r,OrExpression:i,Query:o,SearchTerm:s},n});
define('infrastructure/validation',["ko","knockout.validation","jquery"],function(e,t,n){return e.validation.rules.isUserNameUnique={validator:function(e,t){var r=!0;return n.ajax({async:!1,url:"~/api/usermgmt/IsUsernameUnique",type:"POST",data:{value:e,param:t},success:function(e){r=e===!0},error:function(){r=!1}}),r}},{}});
define('infrastructure/virtualListModel',["require","ko","jquery"],function(e,t){function n(e,n){var r=this;r.data=t.observable(e),r.list=n}function r(e,t,n){var r=this;r.index=e,r.setItems(t,n)}function i(e,r,i){var o=this;if(o.ListItemType=n,i&&"function"==typeof i){var s=function(){};s.prototype=n.prototype,i.prototype=new s,i.prototype.constructor=i,i.base=n.prototype,o.ListItemType=i}o.itemsPerPage=t.observable(e||10),o.count=t.observable(0),o.pages=t.observableArray([]),o.items=t.computed(function(){return o.getItems.call(o)}),o.suspendEvents=!1,o.selectedItem=t.observable(),o.selectedItems=t.computed(function(){return t.utils.arrayFilter(o.items(),function(e){return e.isSelected()})}),r&&this.addPage(r,1)}return r.prototype.setItems=function(e,t){this.items=e,this.count=e&&e.length?e.length:0,this.isLoading=!1,this.isLoaded=void 0!==t?t:e&&e.length>0},i.prototype.getItems=function(){var e=[],n=this;return e=e.concat.apply(e,t.utils.arrayMap(n.pages(),function(e){return e.items}))},i.prototype.addItem=function(e){var t=this,n=new t.ListItemType(e,t),i=t.pages().length?t.pages()[0]:void 0;return i?(i.items.push(n),i.count++):(i=new r(t.pages().length,[n],!0),t.pages().push(i)),t.count(t.count()+1),t.raiseItemsChanged(),n},i.prototype.insertItem=function(e,t){var n=this,r=n.items();if(0>t||t>=r.length)return n.addItem(e);var i=r[t],o=new n.ListItemType(e,n),s=n.findItemPage(i),a=s.items.indexOf(i);return s.items.splice(a,0,o),s.count++,n.count(n.count()+1),n.raiseItemsChanged(),o},i.prototype.removeItem=function(e){var t=this.findItemPage(e);if(t){var n=t.items.indexOf(e);t.items.splice(n,1),t.count--,this.count(this.count()-1),this.raiseItemsChanged()}},i.prototype.addPage=function(e,t){e.inlineCount&&e.inlineCount!=this.count()&&(this.count(e.inlineCount),this._buildPages(e.inlineCount,this.itemsPerPage())),this._addItems(e.results,t-1)},i.prototype.findPage=function(e){return this.pages().length<=0||this.pages().length<e?null:this.pages()[e-1]},i.prototype.findItem=function(e){return t.utils.arrayFirst(this.getItems(),e)},i.prototype.isPageLoaded=function(e){var t=this.findPage(e);return t?t.isLoaded:!1},i.prototype.isPageLoading=function(e){var t=this.findPage(e);return t?t.isLoading:!1},i.prototype.markPageLoading=function(e){var t=this.findPage(e);t&&(t.isLoading=!0)},i.prototype.markPageLoaded=function(e){var t=this.findPage(e);t&&(t.isLoading=!1,t.isLoaded=!0)},i.prototype.removeAll=function(){this.pages([]),this.count(0)},i.prototype.findItemPage=function(e){for(var t=this.pages(),n=0;n<t.length;n++){var r=t[n];if(r.items.indexOf(e)>=0)return r}return null},i.prototype.raiseItemsChanged=function(){this.suspendEvents||this.pages.valueHasMutated()},i.prototype.selectItem=function(e){this.selectedItem()!==e&&this.selectedItem(e)},i.prototype.resetSelection=function(){this.selectedItem(null)},i.prototype._addItems=function(e,n){var r=this,i=t.utils.arrayMap(e,function(e){return new r.ListItemType(e,r)}),o=r.pages()[n];o&&(r.pages()[n].setItems(i),r.pages.valueHasMutated())},i.prototype._buildPages=function(e,t){function n(e){for(var t=[],n=0;e>n;n++)t.push(new i.ListItemType(void 0,this));return t}console.log("_buildPages called. numItems="+e+", itemsPerPage="+t);for(var i=this,o=Math.ceil(i.count()/i.itemsPerPage()),s=[],a=0;o>a;a++){var u=a==o-1,c=u?e-a*t:t,l=new r(a,n.call(i,c),!1);s.push(l)}i.pages(s)},{VirtualList:i,VirtualListItem:n}});
define('knockout.extenders',['knockout'], function (ko) {

    /**
     *  Knockout trackDirty extender
     *  Based on http://schinckel.net/2012/01/14/knockoutjs-dirty-extender./
     */
    ko.extenders.trackDirtyWithInitialStateOf = function (target, initialDirtyState) {
        var hashFunction = ko.toJSON;
        if (ko.mapping) hashFunction = ko.mapping.toJSON;

        var cleanValue = ko.observable(hashFunction(target));
        var dirtyOverride = ko.observable(ko.utils.unwrapObservable(initialDirtyState));

        target.isDirty = ko.computed(function () {
            return dirtyOverride() || hashFunction(target) !== cleanValue();
        });

        target.markClean = function () {
            cleanValue(hashFunction(target));
            dirtyOverride(false);
        };

        target.markDirty = function () {
            dirtyOverride(true);
        };

        return target;
    };

    return {
    };
});
// * iOS zooms on form element focus. This script prevents that behavior.
// * <meta name="viewport" content="width=device-width,initial-scale=1">
//      If you dynamically add a maximum-scale where no default exists,
//      the value persists on the page even after removed from viewport.content.
//      So if no maximum-scale is set, adds maximum-scale=10 on blur.
//      If maximum-scale is set, reuses that original value.
// * <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=2.0,maximum-scale=1.0">
//      second maximum-scale declaration will take precedence.
// * Will respect original maximum-scale, if set.
// * Works with int or float scale values.
define('../Scripts/safari.cancelZoom',['jquery'], function ($) {

    function cancelZoom() {
        var d = document,
            viewport,
            content,
            maxScale = ',maximum-scale=',
            maxScaleRegex = /,*maximum\-scale\=\d*\.*\d*/;

        // this should be a focusable DOM Element
        if (!this.addEventListener || !d.querySelector) {
            return;
        }

        viewport = d.querySelector('meta[name="viewport"]');
        content = viewport.content;

        function changeViewport(event) {
            // http://nerd.vasilis.nl/prevent-ios-from-zooming-onfocus/
            viewport.content = content + (event.type == 'blur' ? (content.match(maxScaleRegex, '') ? '' : maxScale + 10) : maxScale + 1);
        }

        // We could use DOMFocusIn here, but it's deprecated.
        this.addEventListener('focus', changeViewport, true);
        this.addEventListener('blur', changeViewport, false);
    }

    // jQuery-plugin
    (function ($) {
        $.fn.cancelZoom = function () {
            return this.each(cancelZoom);
        };
        // Usage:
        // $('input:text,select,textarea').cancelZoom();
    })(jQuery);

});

requirejs.config({paths:{text:"../Scripts/text",durandal:"../Scripts/durandal",plugins:"../Scripts/durandal/plugins",transitions:"../Scripts/durandal/transitions",entityManagerProvider:"infrastructure/entityManagerProvider",authentication:"infrastructure/authentication",localization:"infrastructure/localization","knockout.extenders":"../Scripts/knockout.extenders",typeahead:"../Scripts/typeahead",moment:"../Scripts/moment",doubleTap:"../Scripts/doubleTap"},map:{"*":{ko:"knockout"}}}),define("jquery",function(){return jQuery}),define("knockout",ko),define("knockout.validation",ko.validation),define("Q",function(){return Q}),define("breeze",function(){return breeze}),define("markdown",function(){return Markdown}),define("toastr",function(){return toastr}),define('main',["durandal/app","durandal/viewLocator","durandal/system","Q","authentication","infrastructure/antiForgeryToken","knockout.validation","localization","infrastructure/moduleLoader","infrastructure/moduleRegistry","plugins/router","jquery","entityManagerProvider","infrastructure/serverUtil","durandal/composition","knockout.extenders","infrastructure/validation","../Scripts/safari.cancelZoom","infrastructure/contentEditing"],function(e,t,n,r,i,a,o,s,l,c,d,u,f,p,h){function m(){var t={message:"Mindestens ein Bereich enthält ungespeicherte Änderungen.",cancel:!1};return e.trigger("app:beforeunload",t),ko.utils.arrayForEach(c.modules(),function(e){return e.routeConfig.hasUnsavedChanges()?(t.cancel=!0,t.message="Das Modul "+e.routeConfig.title+" enthält ungespeicherte Änderungen.",e.router.navigateToModule(),!1):void 0}),t.cancel?t.message:void 0}function v(){require(["plugins/dialog"],function(e){e.MessageBox.defaultViewMarkup=['<div data-view="plugins/messageBox" class="messageBox">','<div class="modal-header">','<h4 data-bind="text: title"></h4>',"</div>",'<div class="modal-body">','<p class="message" data-bind="text: message"></p>',"</div>",'<div class="modal-footer" data-bind="foreach: options">',"<button class=\"btn\" data-bind=\"click: function () { $parent.selectOption($data); }, text: $data, css: { 'btn-primary': $index() == 0, 'btn-default': $index() != 0, autofocus: $index() == 0 }\"></button>","</div>","</div>"].join("\n")})}function g(e){e.archiveSessionStorageToLocalStorage=function(){for(var e={},t=0;t<sessionStorage.length;t++)e[sessionStorage.key(t)]=sessionStorage[sessionStorage.key(t)];localStorage.sessionStorageBackup=JSON.stringify(e),sessionStorage.clear()},e.restoreSessionStorageFromLocalStorage=function(){var e,t=localStorage.sessionStorageBackup;if(t){e=JSON.parse(t);for(var n in e)sessionStorage[n]=e[n];localStorage.removeItem("sessionStorageBackup")}}}n.debug(!0),n.defer=function(e){var t=r.defer();e.call(t,t);var n=t.promise;return t.promise=function(){return n},t},u(document).ajaxSend(function(e,t,n){n.url=p.mapPath(n.url)}),g(e),e.restoreSessionStorageFromLocalStorage(),u(window).bind("beforeunload",m),e.title="CAPS",e.configurePlugins({router:!0,dialog:!0,widget:!0,fileSelection:!0,siteMapNodeSelection:!0,contentSelection:!0}),o.init({insertMessages:!1}),s.localize("de"),h.addBindingHandler("forceViewportHeight"),r.fcall(a.initToken).then(i.initialize).then(l.loadModules(["sitemap","draft","contentfile","user"])).then(f.initialize).then(e.start).then(function(){t.useConvention(),v(),e.setRoot("viewmodels/shell","entrance"),e.trigger("caps:started")}).done()});
define('modules/contentfile/datacontext',["durandal/system","durandal/app","breeze","entityManagerProvider","jquery","infrastructure/userQueryParser"],function(e,t,n,r,i,a){function o(){var e=D.from("Files");return N.executeQuery(e)}function s(e,t,n,r,i){var a=i?D.from("FilteredFiles").withParameters({filterOptions:i}):D.from("Files"),o=l(a,e).expand("Versions").orderBy(r||"Created.At desc").skip((t-1)*n).take(n).inlineCount(!0);return N.executeQuery(o)}function l(e,t){if(t&&t.length){var n=S.getBreezePredicate(t);if(n)return e.where(n)}return e}function c(e){var t=D.from("Files").where("Id","==",e).expand("Tags.Tag, Versions.Properties, Versions.DraftFileResources.DraftFile, Versions.PublicationFileResources.PublicationFile");return N.executeQuery(t)}function d(t){return e.defer(function(e){function n(t){e.resolve(t)}i.ajax("api/dbfileversion/"+t+"/thumbnails",{method:"get"}).done(n).fail(e.reject)}).promise()}function u(t,n){return e.defer(function(e){i.ajax("api/dbfileVersion/"+t+"/thumbnail/"+n,{method:"delete"}).done(e.resolve).fail(e.reject)}).promise()}function f(e){return N.getEntityByKey("DbFile",e)}function h(t){return e.defer(function(e){function n(){N.detachEntity(t),e.resolve()}i.ajax("api/DbFile/"+t.Id(),{method:"delete"}).done(n).fail(e.reject)}).promise()}function p(t){return e.defer(function(n){function r(){try{N.detachEntity(t)}catch(r){e.log(r)}n.resolve()}i.ajax("api/DbFileVersion/"+t.Id(),{method:"delete"}).done(r).fail(n.reject)}).promise()}function m(t,n){return e.defer(function(e){var r=D.from("Tags").where("Id","==",n.Id());N.executeQuery(r).then(function(n){var r=n.results[0],i=N.createEntity("DbFileTag",{FileId:t.Id(),TagId:r.Id()});N.addEntity(i),N.saveChanges().fail(e.reject).done(e.resolve)}).fail(e.reject)}).promise()}function v(e,t){return e.Tags.remove(t),t.entityAspect.setDeleted(),N.saveChanges()}function g(e){N.detachEntity(e)}function b(e){e.Versions().forEach(function(e){g(e)}),g(e)}function y(e){var t=N.getEntities("DraftFileResource");t.forEach(function(t){t.DraftFile()&&t.DraftFile().DraftId()==e.Id()&&N.detachEntity(t)})}function w(e){var t=N.getEntities("PublicationFileResource");t.forEach(function(t){t.PublicationFile()&&t.PublicationFile().PublicationId()==e&&N.detachEntity(t)})}function k(e){var t=(new D).from("DraftFiles").where("Id","==",e.Id()),n=N.executeQueryLocally(t);n&&n.length&&n.forEach(function(e){e.Resources()&&e.Resources().forEach(function(e){N.detachEntity(e)}),N.detachEntity(e)})}function x(t){return e.defer(function(e){function n(t){e.resolve(t)}i.ajax("api/dbfile/metadata",{method:"post",dataType:"json",data:{"":t}}).done(n).fail(e.reject)}).promise()}var N=r.createManager(),D=n.EntityQuery,S=new a;return S.translateColumnName=function(e){return e&&e.length&&/autor/i.test(e)?"Created.By":"FileName"},t.on("caps:sitemapnode:deleted",function(e){var t=e.ContentId();w(t)}),t.on("caps:draft:deleted",function(e){y(e)}),t.on("caps:draft:saved",function(e){e.deletedFiles&&e.deletedFiles.length&&e.deletedFiles.forEach(function(e){k(e)})}),{getFiles:o,fetchFile:c,localGetFile:f,deleteFile:h,deleteFileVersion:p,searchFiles:s,addFileTag:m,removeFileTag:v,detachEntity:g,detachPublicationFileResources:w,detachDraftFileResources:y,detachDraftFile:k,getFileInfo:x,getThumbnailInfo:d,deleteThumbnail:u,detachContentFile:b,isValidUserQuery:function(e){return S.validate(e)}}});
define('modules/contentfile/entities',["require","knockout","infrastructure/utils"],function(e,t,n){function r(){}function i(e){e.isImage=t.computed(function(){return n.stringStartsWith(e.ContentType(),"image")}),e.sortedVersions=t.computed(function(){var t=e.Versions();return t.sort(function(e,t){return e.Id()==t.Id()?0:e.Id()<t.Id()?1:-1}),t}),e.latestVersion=t.computed(function(){var t=e.sortedVersions();return t.length>0?t[0]:null}),e.getVersion=function(n){return t.utils.arrayFirst(e.Versions(),function(e){return e.Id()==n})},e.nextVersion=function(t){var n=e.sortedVersions(),r=n.indexOf(t);return 0>=r?null:n[r-1]},e.previousVersion=function(t){var n=e.sortedVersions(),r=n.indexOf(t);return r>=n.length-1?null:n[r+1]}}function a(){}function o(e){e.imageWidth=t.computed(function(){return c(e,s.imageWidth,0)}),e.imageHeight=t.computed(function(){return c(e,s.imageHeight,0)})}var s={imageWidth:"width",imageHeight:"height"},l=function(e,n){var r=t.utils.arrayFirst(e.Properties(),function(e){return e.PropertyName()==n});return r},c=function(e,t,n){var r=l(e,t);return r?r.PropertyValue():n};return{DbFile:r,DbFileVersion:a,extendModel:function(e){e.registerEntityTypeCtor("DbFile",r,i),e.registerEntityTypeCtor("DbFileVersion",a,o)}}});
define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('text!modules/contentfile/module.html',[],function () { return '<div id="contentfileModule">\r\n    <!--ko router: { transition:\'entrance\', cacheViews:true }--><!--/ko-->\r\n</div>';});

define('modules/contentfile/viewmodels/uploadManager',["ko","durandal/system","durandal/app"],function(e,t,n){function r(r){function i(e,t){s.beforeUploadCalled||(s.beforeUploadCalled=!0,r.beforeUpload.call(this,e,t)),n.trigger("uploadManager:beforeUpload",e,t)}function a(e,i,a){t.isFunction(r.uploadStarted)&&r.uploadStarted(e,i,a),n.trigger("uploadManager:uploadStarted",e,i,a),s.currentUploads.push(e)}function o(e,i){t.isFunction(r.uploadDone)&&r.uploadDone(e,i),n.trigger("uploadManager:uploadDone",i,e),s.currentUploads.remove(i)}var s=this;r=$.extend({},r),s.isUploading=e.observable(!1),s.progress=e.observable(0),s.lastSelection=e.observableArray(),s.pendingUploads=[],s.beforeUploadCalled=!1,s.batchIndex=0,s.currentUploads=e.observableArray(),s.filesSelected=function(e,t){s.lastSelection(t.files),s.pendingUploads=[],s.beforeUploadCalled=!1,s.batchIndex=0},s.addFiles=function(n,o){function l(e,t){s.isUploading(!0),s.pendingUploads.length?s.pendingUploads.forEach(function(n){d(n,e,t)}):d(o,e,t)}function d(t,n,r){e.utils.arrayForEach(t.files,function(t){var i=!1;r&&(i=!!e.utils.arrayFirst(r,function(e){return t.name===e.fileName})),a(t,s.batchIndex++,i?n:void 0)}),n&&(t.formData=n),t.submit()}var c=o.fileInput?o.fileInput.data("storage-option"):"";"replace"!==c&&t.isFunction(r.beforeUpload)?(s.pendingUploads.push(o),i(s.lastSelection(),l)):l()},s.uploadDone=function(t,n){e.utils.arrayForEach(n.result,function(t){var r=e.utils.arrayFirst(n.files,function(e){return e.name===t.fileName});o(t,r)}),s.isUploading(!1)},s.uploadFailed=function(t,n){e.utils.arrayForEach(n.files,function(e){e.listItem.isUploading(!1)}),s.isUploading(!1)},s.uploadProgress=function(e,t){var n=parseInt(100*(t.loaded/t.total),10);s.progress(n)},s.filesDropped=function(e,t){var n;return n=e&&e.delegatedEvent?e.delegatedEvent:e,n&&n.dataTransfer&&"copy"===n.dataTransfer.dropEffect?!1:(s.filesSelected(e,t),void 0)}}return r});
define('modules/contentfile/viewmodels/fileUploadDialog',["plugins/dialog"],function(e){function t(e){this.fileInfo=e,this.existingFiles=ko.utils.arrayFilter(e,function(e){return e.count>0})}return t.prototype.addFiles=function(){e.close(this,{storageAction:"add"})},t.prototype.replaceFiles=function(){e.close(this,{storageAction:"replace"})},t.prototype.cancel=function(){e.close(this)},t});
define('modules/contentfile/module',["infrastructure/moduleFactory","infrastructure/moduleRouter","./entities","durandal/app","./viewmodels/uploadManager","./datacontext","./viewmodels/fileUploadDialog"],function(e,t,n,r,i,a,o){var s=e.createModule({route:"files*details",moduleId:"modules/contentfile/module",title:"Dateien",nav:30,hash:"#files"});return s.extendModel=n.extendModel,s.initializeRouter=function(){s.router=t.createModuleRouter(s,"modules/contentfile","files").map([{route:"",moduleId:"viewmodels/index",title:"Dateien",nav:!1},{route:"detail/:fileId",moduleId:"viewmodels/detail",title:"Details",nav:!1}]).buildNavigationModel()},s.hasLongRunningTasks=function(){return r.uploadManager.isUploading()},s.taskInfo=function(){return{count:r.uploadManager.currentUploads().length,progress:r.uploadManager.progress()}},r.on("caps:started",function(){require(["modules/contentfile/viewmodels/fileSelectionDialog"],function(e){e.install()})}),r.on("caps:contentfile:navigateToFile",function(e){e&&s.router.navigate("#files/detail/"+e.Id())}),r.uploadManager=new i({beforeUpload:function(e,t){var n=ko.utils.arrayMap(e,function(e){return e.name});a.getFileInfo(n).then(function(e){var n=ko.utils.arrayFilter(e,function(e){return e.count>0});if(n.length>0){var i=new o(e);r.showDialog(i).then(function(e){e&&t(e,n)})}else t()})}}),s});
define('modules/contentfile/viewmodels/detail',["durandal/system","durandal/app","knockout","../module","../datacontext","moment","infrastructure/utils","infrastructure/tagService","infrastructure/serverUtil"],function(e,t,n,r,i,a,o,s,l){function c(){function c(){return e.defer(function(e){k(!0),i.fetchFile(g()).then(function(){b(i.localGetFile(g())),e.resolve(b())}).fail(e.fail).done(function(){k(!1)})}).promise()}function d(){w(n.utils.arrayMap(b().Versions(),function(e){return new h(e)})),y(w()[0])}function u(){k(!0)}function f(){k(!1),i.detachContentFile(b()),c().then(function(){d(),t.trigger("caps:contentfile:replaced",b())})}function p(e){S([]),i.getThumbnailInfo(e).then(function(e){S(n.utils.arrayMap(e,function(e){return new m(e)}))})}function h(e){var r=this;r.entity=e,r.isCurrentVersion=n.computed(function(){return y()&&r.entity.Id()===y().entity.Id()}),r.isInUse=n.computed(function(){return r.entity.DraftFileResources().length>0||r.entity.PublicationFileResources().length>0}),r.remove=function(){w.remove(r)},r.select=function(){y(r)},r.navigateToResourceOwner=function(e){t.trigger("caps:contentfile:navigateToResourceOwner",e)}}function m(e){var t=this;t.name=n.computed(function(){return e.name}),t.deleteThumbnail=function(){i.deleteThumbnail(e.fileVersionId,e.id).then(function(){S.remove(t)})}}var v=this,g=n.observable(0),b=n.observable(),y=n.observable(),w=n.observableArray(),k=n.observable(!1),x=n.observable(),N=n.observable(!1),D=t.uploadManager,S=n.observableArray();v.fileId=g,v.file=b,v.fileVersion=y,v.versions=w,v.isLoading=k,v.uploadManager=D,v.thumbnails=S,v.addTagUIVisible=N,v.tagName=x,v.moment=a,v.utils=o,v.server=l,v.activate=function(e){return b(null),g(e),x(null),N(!1),t.on("uploadManager:uploadStarted",u),t.on("uploadManager:uploadDone",f),c().then(function(){d(),p(y().entity.Id())}).fail(function(e){alert(e.message)})},v.deactivate=function(){t.off("uploadManager:uploadStarted",u),t.off("uploadManager:uploadDone",f)},v.uploadedFromNowBy=n.computed(function(){return y()&&y().entity?a(y().entity.Modified().At()).fromNow()+" von "+y().entity.Modified().By():""}),v.uploadedAt=n.computed(function(){return y()&&y().entity?a(y().entity.Modified().At()).format("LLLL"):""}),v.refresh=function(){return c()},v.navigateBack=function(){r.router.navigate(r.routeConfig.hash)},v.previewTemplate=function(e){return e&&e.File()&&e.File().isImage()?"file-preview-image":"file-preview-general"},v.tagNames=n.computed(function(){return n.utils.arrayMap(s.tags(),function(e){return e.Name()})}),v.addTag=function(){N(!0);var e=x();e&&e.length&&s.getOrCreateTag(e).then(function(e){return i.addFileTag(b(),e)}).fail(function(e){window.alert(e.message||e.responseText)}).done(function(){t.trigger("caps:tag:added",x()),x("")})},v.cancelAddTag=function(){x(null),N(!1)},v.updateTagName=function(e,t,n){x(n.value)},v.removeTag=function(e){i.removeFileTag(b(),e).then(function(e){var r=n.utils.arrayFilter(e.entities,function(e){return"Tag"==e.entityType.shortName});n.utils.arrayForEach(r,function(e){t.trigger("caps:tag:deleted",e)})}).fail(function(){alert(err.message||err.responseText)}).done(function(){t.trigger("caps:tag:removed",e)})},v.deleteVersion=function(e){t.showMessage("Soll die Version wirklich gelöscht werden?","Version löschen?",["Ok","Abbrechen"]).then(function(t){"Ok"===t&&i.deleteFileVersion(e.entity).then(function(){if(e.remove(),e.isCurrentVersion()){var t=b().nextVersion(e)||b().previousVersion(e);y(new h(t))}})})},v.deleteFile=function(){t.showMessage("Soll die Datei wirklich gelöscht werden?","Datei löschen?",["Ok","Abbrechen"]).then(function(e){"Ok"===e&&i.deleteFile(b()).then(function(){t.trigger("caps:file:deleted",b()),v.navigateBack()})})}}return c});
define('modules/contentfile/viewmodels/fileListItem',["ko"],function(e){function t(n,r){var i=this;t.base&&t.base.constructor.call(this,n,r),i.isUploading=e.observable(!1),i.isSelected=e.observable(!1),i.isSelectedItem=e.computed(function(){return r.selectedItem()===i}),i.toggleSelected=function(){i.isSelected(!i.isSelected()),i.isSelected()&&r.selectItem(i)},i.selectItem=function(){r.selectItem(i)}}return t});
define('modules/contentfile/viewmodels/fileSearchControl',["ko","infrastructure/filterModel","infrastructure/listSortModel","infrastructure/tagService","../datacontext"],function(e,t,n,r,i){function a(){var t=this;t.searchWords=e.observable(""),t.sortOptions=t.createSortOptions(),t.tagFilterOptions=null,t.filterOptions=e.observable(),t.currentFilter="",t.hasFilterOptions=e.computed(function(){return r.tags()&&r.tags().length>0}),t.beginSetFilter=function(){return t.tagFilterOptions=t.tagFilterOptions||t.createTagFilterOptions(),t.filterOptions(t.tagFilterOptions.clone()),!0},t.endSetFilter=function(){var e=t.filterOptions().toString();e!==t.currentFilter&&(t.tagFilterOptions=t.filterOptions(),t.currentFilter=e,t.refreshResults()),t.filterOptions(null)},t.search=function(){return t.searchWords()&&t.searchWords().length&&!i.isValidUserQuery(t.searchWords())?!1:(t.refreshResults(),void 0)}}function o(e){return new t.FilterItem("DbFileTag",e.Name(),e.Id())}return a.prototype.createTagFilterOptions=function(){var n=e.utils.arrayMap(r.tags(),function(e){return o(e)});return new t.FilterOptions(n)},a.prototype.createSortOptions=function(){var e=this,t=[new n.ListColumn("Created.At","Hochgeladen am"),new n.ListColumn("Created.By","Hochgeladen von"),new n.ListColumn("Modified.At","Letzte Änderung"),new n.ListColumn("Modified.By","Letzte Änderung von"),new n.ListColumn("FileName","Dateiname")];return new n.SortOptions(t,function(){e.refreshResults()})},a.prototype.refreshResults=function(){},a.prototype.addTagFilter=function(e){this.tagFilterOptions&&this.tagFilterOptions.add(o(e))},a.prototype.removeTagFilter=function(e){if(this.tagFilterOptions){var t=this.tagFilterOptions.findFilter(e.Id());t&&this.tagFilterOptions.filters.remove(t)}},a});
define('modules/contentfile/viewmodels/fileSelectionDialog',["plugins/dialog","ko","./fileListItem","durandal/system","durandal/app","../datacontext","infrastructure/virtualListModel","./fileSearchControl","toastr"],function(e,t,n,r,i,a,o,s,l){function c(e){function r(e,t,n){var r=n&&n.storageAction&&"replace"===n.storageAction;if(!r){var i=d.list.insertItem(void 0,t);i.isUploading(!0),i.tempData=e}}function c(e,t){var n=d.list.findItem(function(n){return n.tempData===e||n.data()&&n.data().Id()===t.id});a.fetchFile(t.id).then(function(){n.data(a.localGetFile(t.id)),n.isUploading(!1),n.isSelected(!0)}).fail(function(){l.error("Die Datei "+t.fileName+" konnte nicht geladen werden.")})}var d=this;e=e||{},d.title=e.title||"Dateien hinzufügen",d.list=new o.VirtualList(35,null,n),d.isLoading=t.observable(!1),d.selectedFile=d.list.selectedItem,d.selectedFiles=d.list.selectedItems,d.initialized=!1,d.searchControl=new s,d.uploadManager=i.uploadManager,d.searchControl.refreshResults=function(){d.list.resetSelection(),d.list.removeAll(),d.loadPage(1)},d.activate=function(){console.log("Activating FileSelectionDialog"),d.initialized||(d.initialized=!0,d.loadPage(1)),i.on("uploadManager:uploadStarted",r),i.on("uploadManager:uploadDone",c)},d.deactivate=function(){console.log("Deactivating FileSelectionDialog"),i.off("uploadManager:uploadStarted",r),i.off("uploadManager:uploadDone",c)},d.loadHandler=function(e,t){function n(e){var n=this.list.findPage(e);n.isLoaded||n.isLoading||(this.list.markPageLoading(e),this.loadPage(e).then(function(){this.list.markPageLoaded(e),t.pageLoaded(e)}))}var r=t.firstVisible.viewModel?d.list.findItemPage(t.firstVisible.viewModel):void 0,i=t.lastVisible.viewModel?d.list.findItemPage(t.lastVisible.viewModel):void 0;if(r&&i)for(var a=r.index;a<=i.index;a++)n.call(d,a+1)}}return c.prototype.loadPage=function(e){var t=this,n=t.searchControl;return r.defer(function(r){t.isLoading(!0),a.searchFiles(n.searchWords(),e,t.list.itemsPerPage(),n.sortOptions.getOrderBy(),n.currentFilter).then(function(n){t.list.addPage(n,e),r.resolve()}).fail(r.reject).done(function(){t.isLoading(!1)})}).promise()},c.prototype.selectOk=function(){var n=t.utils.arrayMap(this.selectedFiles(),function(e){return e.data()});!n.length&&this.selectedFile()&&n.push(this.selectedFile().data()),e.close(this,{dialogResult:!0,selectedFiles:n})},c.prototype.selectCancel=function(){e.close(this,{dialogResult:!1})},c.install=function(){require(["plugins/fileSelection"],function(e){e.registerDialog(c)})},c});
define('doubleTap',['jquery', 'knockout'], function (jQuery, ko) {

    /**
     * Creates a event handler which unifies click and dblclick events between desktop and touch as tap and dbltap.
     * Copyright (c)2012 Stephen M. McKamey.
     * Licensed under The MIT License.
     * 
     * @param {number} speed max delay between multi-clicks in milliseconds (optional, default: 500ms)
     * @param {number} distance max distance between multi-clicks in pixels (optional, default: 40px)
     * @return {function(Event)} touchend/mouseup event handler
     */
    var doubleTap = function (speed, distance) {
        

        // default dblclick speed to half sec (default for Windows & Mac OS X)
        speed = Math.abs(+speed) || 500;//ms
        // default dblclick distance to within 40x40 pixel area
        distance = Math.abs(+distance) || 40;//px

        // Date.now() polyfill
        var now = Date.now || function () {
            return +new Date();
        };

        var cancelEvent = function (e) {
            e = (e || window.event);

            if (e) {
                if (e.preventDefault) {
                    e.stopPropagation();
                    e.preventDefault();
                } else {
                    try {
                        e.cancelBubble = true;
                        e.returnValue = false;
                    } catch (ex) {
                        // IE6
                    }
                }
            }
            return false;
        };

        var taps = 0,
            last = 0,
            // NaN will always test false
            x = NaN,
            y = NaN;

        return function (e) {
            e = (e || window.event);

            var time = now(),
				touch = e.changedTouches ? e.changedTouches[0] : e,
				nextX = +touch.clientX,
				nextY = +touch.clientY,
				target = e.target || e.srcElement,
				e2,
				parent;

            if ((last + speed) > time &&
				Math.abs(nextX - x) < distance &&
				Math.abs(nextY - y) < distance) {
                // continue series
                taps++;

            } else {
                // reset series if too slow or moved
                taps = 1;
            }

            // update starting stats
            last = time;
            x = nextX;
            y = nextY;

            // fire tap event
            if (document.createEvent) {
                e2 = document.createEvent('MouseEvents');
                e2.initMouseEvent(
					'tap',
					true,				// click bubbles
					true,				// click cancelable
					e.view,				// copy view
					taps,				// click count
					touch.screenX,		// copy coordinates
					touch.screenY,
					touch.clientX,
					touch.clientY,
					e.ctrlKey,			// copy key modifiers
					e.altKey,
					e.shiftKey,
					e.metaKey,
					e.button,			// copy button 0: left, 1: middle, 2: right
					e.relatedTarget);	// copy relatedTarget

                if (!target.dispatchEvent(e2)) {
                    // pass on cancel
                    cancelEvent(e);
                }

            } else {
                e.detail = taps;

                // manually bubble up
                parent = target;
                while (parent && !parent.tap && !parent.ontap) {
                    parent = parent.parentNode || parent.parent;
                }
                if (parent && parent.tap) {
                    // DOM Level 0
                    parent.tap(e);

                } else if (parent && parent.ontap) {
                    // DOM Level 0, IE
                    parent.ontap(e);

                } else if (typeof jQuery !== 'undefined') {
                    // cop out and patch IE6-8 with jQuery
                    jQuery(this).trigger('tap', e);
                }
            }

            if (taps === 2) {
                // fire dbltap event only for 2nd click
                if (document.createEvent) {
                    e2 = document.createEvent('MouseEvents');
                    e2.initMouseEvent(
						'dbltap',
						true,				// dblclick bubbles
						true,				// dblclick cancelable
						e.view,				// copy view
						taps,				// click count
						touch.screenX,		// copy coordinates
						touch.screenY,
						touch.clientX,
						touch.clientY,
						e.ctrlKey,			// copy key modifiers
						e.altKey,
						e.shiftKey,
						e.metaKey,
						e.button,			// copy button 0: left, 1: middle, 2: right
						e.relatedTarget);	// copy relatedTarget

                    if (!target.dispatchEvent(e2)) {
                        // pass on cancel
                        cancelEvent(e);
                    }

                } else {
                    e.detail = taps;

                    // manually bubble up
                    parent = target;
                    while (parent && !parent.dbltap && !parent.ondbltap) {
                        parent = parent.parentNode || parent.parent;
                    }
                    if (parent && parent.dbltap) {
                        // DOM Level 0
                        parent.dbltap(e);

                    } else if (parent && parent.ondbltap) {
                        // DOM Level 0, IE
                        parent.ondbltap(e);

                    } else if (typeof jQuery !== 'undefined') {
                        // cop out and patch IE6-8 with jQuery
                        jQuery(this).trigger('dbltap', e);
                    }
                }
            }
        };
    };

    ko.bindingHandlers.doubleTap = {
        init: function (elem, valueAccessor) {
            var listener = doubleTap(),
                eventName = ('ontouchend' in elem) ? 'touchend' : 'mouseup';
            elem.addEventListener(eventName, listener, false);

            ko.utils.domNodeDisposal.addDisposeCallback(elem, function () {
                elem.removeEventListener(eventName, listener);
            });
        }
    };

    return doubleTap;
});

define('modules/contentfile/viewmodels/index',["ko","durandal/system","durandal/app","../module","../datacontext","infrastructure/virtualListModel","toastr","Q","doubleTap","./fileListItem","./uploadManager","./fileSearchControl","infrastructure/serverUtil"],function(e,t,n,i,a,o,s,l,c,d,u,f,p){function h(e){var n=N,r=n.hasFilterOptions()?n.currentFilter:"",i=n.sortOptions.getOrderBy();return console.log("loadPage called. pageNumber="+e+", Filter="+r),t.defer(function(t){y(!0),a.searchFiles(n.searchWords(),e,b.itemsPerPage(),i,r).then(function(n){b.addPage(n,e),t.resolve()}).fail(t.reject).done(function(){y(!1)})}).promise()}function m(e){function t(){b.selectedItem()===e&&b.resetSelection(),b.removeItem(e)}function r(){n.showMessage("Die Datei konnte nicht gelöscht werden.","Nicht erfolgreich")}return a.deleteFile(e.data()).then(t).fail(r)}var v,g=!1,b=new o.VirtualList(35,null,d),y=e.observable(!1),w=n.uploadManager,k=e.observable(!1),x=e.observable(0),N=new f;return i.router.on("router:navigation:attached",function(e){e==v&&k(!0)}),n.on("caps:tags:added",function(e){N.addTagFilter(e)}),n.on("caps:tag:deleted",function(e){N.removeTagFilter(e)}),n.on("caps:file:deleted",function(e){var t=b.findItem(function(t){return t.data().Id()==e.Id()});t&&(b.selectedItem()===t&&b.resetSelection(),b.removeItem(t))}),n.on("uploadManager:uploadStarted",function(e,t,n){var r=n&&n.storageAction&&"replace"===n.storageAction;if(!r){var i=b.insertItem(void 0,t);i.isUploading(!0),i.tempData=e}}),n.on("uploadManager:uploadDone",function(e,t){var n=b.findItem(function(n){return n.tempData===e||n.data()&&n.data().Id()===t.id});a.fetchFile(t.id).then(function(){n&&(n.data(a.localGetFile(t.id)),n.isUploading(!1))}).fail(function(){s.error("Die Datei "+r.FileName+" konnte nicht geladen werden.")})}),N.refreshResults=function(){v.refresh()},v={list:b,isLoading:y,uploadManager:w,selectedFile:b.selectedItem,selectedFiles:b.selectedItems,scrollTop:x,isInteractive:k,searchControl:N,server:p,activate:function(){g||(g=!0,h(1))},deactivate:function(){k(!1)},deleteFile:function(e){var t="Datei löschen",r="Abbrechen";n.showMessage("Soll die Datei "+e.data().FileName()+" wirklich gelöscht werden?","Datei löschen",[t,r]).then(function(n){n===t&&m(e)})},deleteSelection:function(){var e=this.selectedFiles();if(0!==e.length){if(1==e.length)return this.deleteFile(e[0]);var t="Auswahl löschen";n.showMessage("Sollen die "+e.length+" ausgewählten Dateien wirklich endgültig gelöscht werden?","Auswahl löschen",[t,"Abbrechen"]).then(function(n){if(n===t){b.suspendEvents=!0;var r=l.when({});e.forEach(function(e){r=r.then(function(){return m(e)})}),l.when(r).then(function(){b.suspendEvents=!1,b.raiseItemsChanged()})}})}},refresh:function(){x(0),b.resetSelection(),b.removeAll(),h(1)},resetSelectedItem:function(){b.resetSelection()},showSelectedFile:function(){this.showDetail(b.selectedItem())},showDetail:function(e){e&&(b.selectItem(e),i.router.navigate("#files/detail/"+e.data().Id()))},loadHandler:function(e,t){function n(e){var n=b.findPage(e);n.isLoaded||n.isLoading||(b.markPageLoading(e),h(e).then(function(){b.markPageLoaded(e),t.pageLoaded(e)}))}if(console.log("loadHandler called. First visible: "+t.firstVisible.index+" (Page #"+t.firstVisible.page+"); Last visible: "+t.lastVisible.index+" (Page #"+t.lastVisible.page+")"),k()){var r=t.firstVisible.viewModel?b.findItemPage(t.firstVisible.viewModel):void 0,i=t.lastVisible.viewModel?b.findItemPage(t.lastVisible.viewModel):void 0;if(r&&i)for(var a=r.index;a<=i.index;a++)n(a+1)}}}});
define('text!modules/contentfile/views/detail.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n\r\n    <!-- ko if: file() -->\r\n    <div class="col-md-8 col-lg-9 fixed-container" data-bind="forceViewportHeight: { minWidth: 992 }">\r\n        <!-- ko template: { name: previewTemplate, data: fileVersion().entity } -->\r\n        <!-- /ko -->\r\n    </div>\r\n\r\n    <div class="col-md-4 col-lg-3 col-md-offset-8 col-lg-offset-9">\r\n        <h4 class="break-h"><span data-bind="text: file().FileName"></span> <small>Details</small></h4>\r\n        <div>\r\n            <p>\r\n            Hochgeladen <span data-bind="text: uploadedFromNowBy, attr: { title: uploadedAt }"></span>\r\n            </p>\r\n            <!-- ko with: fileVersion() -->\r\n            <!-- ko if: isInUse() -->\r\n            <p><strong>In Verwendung</strong></p>\r\n            <ul class="list-inline">\r\n                <!-- ko foreach: entity.DraftFileResources() -->\r\n                <li data-bind="if: DraftFile()">\r\n                    <a href="#" data-bind="click: $parent.navigateToResourceOwner"><i class="fa fa-file-text"></i> Inhalt <!-- ko text: DraftFile().DraftId --><!-- /ko --></a>\r\n                </li>\r\n                <!-- /ko -->                \r\n                <!-- ko foreach: entity.PublicationFileResources() -->\r\n                <li>\r\n                    <a href="#" data-bind="click: $parent.navigateToResourceOwner"><i class="fa fa-file-text"></i> Veröffentlichung <!-- ko text: PublicationFile().PublicationId --><!-- /ko --></a>\r\n                </li>\r\n                <!-- /ko -->\r\n            </ul>\r\n            <!-- /ko -->\r\n            <!-- /ko -->\r\n        </div>\r\n        <div class="well well-sm">\r\n            <div>\r\n                Inhaltstyp: <span data-bind="text: file().ContentType()"></span>\r\n            </div>\r\n            <div>\r\n                Größe: <!-- ko text: utils.formatFileSize(file().latestVersion().FileSize()) --><!-- /ko -->\r\n            </div>\r\n            <!-- ko if: moment(file().Created().At()).diff(moment(file().Modified().At()), \'seconds\') > 0 -->\r\n            <div data-bind="with: file().Modified">\r\n                Letzte Änderung <span data-bind="text: moment(At()).fromNow(), attr: { title: moment(At()).format(\'LLLL\') }"></span> \r\n                von <span data-bind="text: By"></span>\r\n            </div>\r\n            <!-- /ko -->\r\n\r\n            <!-- ko if: file().isImage -->\r\n            <div data-bind="with: file().latestVersion">\r\n                Bildgröße: <span data-bind="text: imageWidth"></span> x <span data-bind="text: imageHeight"></span> px\r\n            </div>\r\n            <!-- /ko -->\r\n        </div>\r\n\r\n        <h4>\r\n            Markierungen\r\n            <!-- ko if: !addTagUIVisible() -->\r\n            <small><a data-bind="click: addTag" href="#">Hinzufügen</a></small>\r\n            <!-- /ko -->\r\n        </h4>        \r\n        <!-- ko if: addTagUIVisible -->\r\n        <form role="form">\r\n            <div class="input-group">\r\n                <input type="text" class="form-control hide-ms-clear" data-bind="typeahead: tagNames, value: tagName, event: { \'typeahead:selected\': updateTagName, \'typeahead:autocompleted\': updateTagName }" />\r\n                <div class="input-group-btn">\r\n                    <button data-bind="click: addTag" class="btn btn-default">Ok</button>\r\n                </div>\r\n            </div>\r\n            <p class="form-control-buttons"><a data-bind="click: cancelAddTag" href="#">Abbrechen</a></p>\r\n        </form>\r\n        <br />\r\n        <!-- /ko -->        \r\n        <ul data-bind="foreach: file().Tags" class="list-group">\r\n            <li data-bind="if: Tag()" class="list-group-item">\r\n                <div class="pull-right">\r\n                    <button class="btn btn-link btn-xs" data-bind="click: $parent.removeTag"><i class="fa fa-times"></i></button>\r\n                </div>\r\n                <i class="fa fa-tag"></i> <span data-bind="text: Tag().Name"></span>\r\n            </li>\r\n        </ul>\r\n\r\n        <h4>Thumbnails</h4>\r\n        <ul data-bind="foreach: thumbnails" class="list-unstyled">\r\n            <li>\r\n                <span data-bind="text:name"></span> <a href="#" data-bind="click: deleteThumbnail">Löschen</a>\r\n            </li>\r\n        </ul>\r\n        \r\n        <!-- ko if: versions().length > 1 -->\r\n        <h4>Weitere Versionen <small>(<!-- ko text: versions().length - 1 --><!-- /ko -->)</small></h4>\r\n        <ul data-bind="foreach: versions" class="list-unstyled">\r\n            <!-- ko if: !isCurrentVersion() -->\r\n            <li>\r\n                <!-- ko if: !isInUse() -->\r\n                <a href="#" data-bind="click: select, text: entity.Id"></a>\r\n                <!-- /ko -->\r\n                <!-- ko if: isInUse -->\r\n                <small>In Verwendung</small>\r\n                <!-- /ko -->\r\n            </li>\r\n            <!-- /ko -->\r\n        </ul>\r\n        <!-- /ko -->\r\n    </div>\r\n    <!-- /ko -->\r\n        \r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        \r\n        <div class="navbar-panel pull-left">                        \r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: navigateBack">\r\n                        <i class="fa fa-arrow-left"></i> Alle Dateien</a>\r\n                </li>\r\n                <li>\r\n                    <a class="btn-fileinput">\r\n                        <span><i class="fa fa-repeat"></i> Datei ersetzen</span>\r\n                        <!-- ko with: uploadManager -->\r\n                        <input type="file" name="files" data-url="~/api/DbFileUpload"\r\n                               data-bind="fileupload: { add: addFiles, done: uploadDone, fail: uploadFailed, progressall: uploadProgress, dropZone: null, formData: { storageAction: \'replace\', versionId: $parent.fileVersion().entity.Id() } }"\r\n                               data-storage-option="replace">\r\n                        <!-- /ko -->\r\n                    </a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: deleteFile">\r\n                        <i class="fa fa-trash-o"></i> Datei löschen\r\n                    </a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n        <div class="navbar-panel pull-right">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" title="Aktualisieren" data-bind="click: refresh"><i class="fa fa-refresh fa-fw" data-bind="css: { \'fa-spin\': isLoading }"></i></a>\r\n                </li>\r\n            </ul>\r\n        </div> \r\n    </div>\r\n\r\n    <script type="text/html" id="file-preview-image">\r\n        <div class="file-preview image-preview" data-bind="stretchLineHeight: true">\r\n            <img data-bind="attr: { src: $root.server.mapPath(\'~/DbFileContent/Inline/\' + Id() + \'?h=\' + Hash()) }" />\r\n        </div>\r\n    </script>\r\n\r\n    <script type="text/html" id="file-preview-general">\r\n        <div class="file-preview unknown-preview">\r\n            <span><i class="fa fa-file fa-4x"></i></span>\r\n        </div>\r\n    </script>\r\n</div>';});

define('text!modules/contentfile/views/fileSearchControl.html',[],function () { return '<div class="input-group">\r\n    <!-- Filter Dropdown -->\r\n    <!-- ko if: hasFilterOptions -->\r\n    <div class="input-group-btn" data-bind="event: { \'show.bs.dropdown\': beginSetFilter }">\r\n        <a id="A1" role="button" data-toggle="dropdown" data-target="#" href="#" class="btn btn-default dropdown-toggle">\r\n            <span><i class="fa fa-filter"></i></span>\r\n            <b class="caret" />\r\n        </a>\r\n        <ul class="dropdown-menu" role="menu" aria-labelledby="A1">\r\n            <li role="presentation" class="dropdown-header">Markierungen</li>\r\n            <li data-bind="if: filterOptions()">\r\n                <div class="dropdown menu-section">\r\n                    <ul class="checkbox-list" role="menu">\r\n                        <li>\r\n                            <a role="menuitem" tabindex="-1" href="#" class="checkable-item" data-bind="click: filterOptions().toggleAll, clickBubble: false">\r\n                                <span class="icon"><i class="fa fa-fw" data-bind="css: { \'fa-square-o\': !filterOptions().allSelected(), \'fa-check-square-o\': filterOptions().allSelected() }"></i></span>\r\n                                <span class="mnu-label">Alle</span>\r\n                            </a>\r\n                        </li>\r\n                    </ul>\r\n                </div>\r\n            </li>\r\n            <li data-bind="if: filterOptions()">\r\n                <div id="FiltersDropDown" class="dropdown menu-section scrollable" data-bind="click: function () { $(\'#FiltersDropDown > ul\').focus(); }, clickBubble: false">\r\n                    <ul class="checkbox-list" role="menu" data-bind="foreach: filterOptions().filters">\r\n                        <li>\r\n                            <a role="menuitem" tabindex="-1" href="#" class="checkable-item" data-bind="click: toggleSelect, clickBubble: false">\r\n                                <span class="icon"><i class="fa fa-fw" data-bind="css: { \'fa-square-o\': !isSelected(), \'fa-check-square-o\': isSelected() }"></i></span>\r\n                                <span data-bind="text: title" class="mnu-label"></span>\r\n                            </a>\r\n                        </li>\r\n                    </ul>\r\n                </div>\r\n            </li>\r\n            <li data-bind="if: filterOptions()">\r\n                <div class="dropdown menu-section">\r\n                    <ul class="checkbox-list" role="menu">\r\n                        <li>\r\n                            <a role="menuitem" tabindex="-1" href="#" class="checkable-item" data-bind="click: filterOptions().toggleShowOthers, clickBubble: false">\r\n                                <span class="icon"><i class="fa fa-fw" data-bind="css: { \'fa-square-o\': !filterOptions().showOthers(), \'fa-check-square-o\': filterOptions().showOthers() }"></i></span>\r\n                                <span class="mnu-label">Keine Markierungen</span>\r\n                            </a>\r\n                        </li>\r\n                    </ul>\r\n                </div>\r\n            </li>\r\n            <li>\r\n                <div class="dropdown-buttons">\r\n                    <button class="btn btn-default btn-sm" data-bind="click: endSetFilter">Ok</button>\r\n                    <button class="btn btn-default btn-sm">Abbrechen</button>\r\n                </div>\r\n            </li>\r\n        </ul>\r\n    </div>\r\n    <!-- /ko -->\r\n    <!-- Searchwords -->\r\n    <input type="text" data-bind="delayedSearch: { searchObservable: searchWords, searchHandler: search }" class="form-control hide-ms-clear" placeholder="Suche" />\r\n    <!-- Sort Button/Dropdown -->\r\n    <div class="input-group-btn">\r\n        <a href="#" role="button" data-bind="click: sortOptions.toggleSortDirection" class="btn btn-default">\r\n            <span><i data-bind="css: { \'fa-sort-alpha-asc\': sortOptions.sortDirection() == \'asc\', \'fa-sort-alpha-desc\': sortOptions.sortDirection() != \'asc\' }" class="fa fa-sort-alpha-asc"></i></span>\r\n        </a>\r\n        <a id="dLabel" role="button" data-toggle="dropdown" data-target="#" href="#" class="btn btn-default dropdown-toggle">\r\n            <b class="caret" />\r\n        </a>\r\n        <ul class="dropdown-menu pull-right" role="menu" aria-labelledby="dLabel">\r\n            <!-- ko foreach: sortOptions.columns -->\r\n            <li role="presentation">\r\n                <a role="menuitem" tabindex="-1" href="#" data-bind="click: sort">\r\n                    <span class="pull-right" data-bind="visible: isSelected"><i class="fa fa-check"></i></span>\r\n                    <span data-bind="text: title" class="mnu-label"></span>\r\n                </a>\r\n            </li>\r\n            <!-- /ko -->\r\n            <li role="presentation" class="divider"></li>\r\n            <li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-bind="click: sortOptions.sortAsc"><span class="pull-right" data-bind="    visible: sortOptions.sortDirection() == \'asc\'"><i class="fa fa-check"></i></span> Aufsteigend</a></li>\r\n            <li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-bind="click: sortOptions.sortDesc"><span class="pull-right" data-bind="    visible: sortOptions.sortDirection() == \'desc\'"><i class="fa fa-check"></i></span> Absteigend</a></li>\r\n        </ul>\r\n    </div>\r\n</div>';});

define('text!modules/contentfile/views/fileSelectionDialog.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n    <div class="panel-padding-h subnav-fixed-top-container subnav-extrapadding">\r\n\r\n        <div class="toolbar row subnav-fixed-top">\r\n            <div class="col-md-6 col-lg-8">\r\n                <h3 data-bind="text: title"></h3>\r\n            </div>\r\n            <div class="col-md-6 col-lg-4">\r\n                <!-- ko compose: searchControl --><!-- /ko -->\r\n            </div>\r\n        </div>\r\n        \r\n        <div id="fileSelectionDialog-drop-zone" data-bind="forceViewportHeight: { minWidth: 992 }">\r\n            <div class="row thumbnails-fixed-size" data-bind="lazyLoad: { data: list.items(), loadHandler: loadHandler }">\r\n                <div class="col-sm-6 col-md-3 col-lg-2">\r\n                    <div class="thumbnail-container" data-bind="css: { \'item-checked\': isSelected  }">\r\n                        <a href="#" class="thumbnail" data-bind="css: { \'item-selected\': isSelectedItem }, clickBubble: false, click: selectItem">\r\n                            <!-- ko if: data() -->\r\n                            <!-- ko with: data() -->\r\n                            <!-- ko if: isImage -->\r\n                            <img src="/content/images/blank.gif" data-bind="attr: { \'data-src\': \'DbFileContent/Thumbnail/\' + latestVersion().Id() + \'?thumbnailName=220x160&h=\' + latestVersion().Hash(), title: FileName, alt: FileName }, lazyImage: true" />\r\n                            <!-- /ko -->\r\n                            <!-- ko if: !isImage() -->\r\n                            <span data-bind="attr: { title: FileName }"><i class="fa fa-file fa-4x"></i></span>\r\n                            <!-- /ko -->\r\n                            <!-- /ko -->\r\n                            <!-- /ko -->\r\n                            <!-- ko if: isUploading() -->\r\n                            <span><i class="fa fa-spinner fa-spin fa-4x"></i></span>\r\n                            <!-- /ko -->\r\n                        </a>\r\n                        <!-- ko if: data() -->\r\n                        <div class="item-check" data-bind="click: toggleSelected, clickBubble: false, attr: { title: data().FileName() + \' auswählen\' }">\r\n                            <i class="fa" data-bind="css: { \'fa-check-square-o\': isSelected, \'fa-square-o\': !isSelected() }"></i>\r\n                        </div>\r\n                        <div class="thumbnail-controls">\r\n                            <!--<a class="btn-link pull-right" data-bind="click: $parent.showDetail, clickBubble: false" title="Details anzeigen"><i class="icon-arrow-right icon-2x"></i></a>-->\r\n                            <a class="btn-link" data-bind="click: $parent.deleteFile, clickBubble: false, attr: { title: data().FileName() + \' löschen\' }"><i class="fa fa-trash-o fa-2x"></i></a>\r\n                        </div>\r\n                        <!-- /ko -->\r\n                        <div class="thumbnail-label">\r\n                            <!-- ko if: data() -->\r\n                            <span class="thumbnail-label-content" data-bind="text: data().FileName, attr: { title: data().FileName }"></span>\r\n                            <!-- /ko -->\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-right">\r\n            <div class="navbar-text" data-bind="visible: uploadManager.isUploading">\r\n                Upload: <span data-bind="text: uploadManager.progress"></span> %\r\n            </div>\r\n        </div>\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: selectCancel"><span><i class="fa fa-arrow-left fa-fw"></i> Abbrechen</span></a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: selectOk"><span><i class="fa fa-save fa-fw"></i> Hinzufügen</span></a>\r\n                </li>\r\n                <li>\r\n                    <a class="btn-fileinput">\r\n                        <span><i class="fa fa-plus"></i> Dateien hochladen</span>\r\n                        <!-- ko with: uploadManager -->\r\n                        <input type="file" name="files" data-url="~/api/DbFileUpload"\r\n                               data-bind="fileupload: { change: filesSelected, add: addFiles, done: uploadDone, fail: uploadFailed, progressall: uploadProgress, drop: filesDropped, dropZone: $(\'#fileSelectionDialog-drop-zone\') }" multiple>\r\n                        <!-- /ko -->\r\n                    </a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!modules/contentfile/views/fileUploadDialog.html',[],function () { return '<div class="messageBox">\r\n    <div class="modal-header">\r\n        <h4>Dateien hinzufügen</h4>\r\n    </div>\r\n    <div class="modal-body">\r\n        <p class="message" data-bind="if: existingFiles.length > 1">Es wurden <strong data-bind="text: existingFiles.length"></strong> Namenskonflikte festgestellt. Was möchtest Du tun?</p>\r\n        <p class="message" data-bind="if: existingFiles.length <= 1">Es wurde ein Namenskonflikt festgestellt. Was möchtest Du tun?</p>\r\n    </div>\r\n    <div class="modal-footer">\r\n        <button class="btn btn-primary btn-lg btn-block text-left" data-bind="click: addFiles">\r\n            <i class="fa fa-plus fa-lg pull-left"></i> \r\n            <div>\r\n                Eine neue Datei anlegen<br />\r\n                <small>Es wird eine neue Datei mit eindeutigem Namen angelegt.</small>\r\n            </div>\r\n        </button>\r\n        \r\n        <button class="btn btn-default btn-lg btn-block text-left" data-bind="click: replaceFiles">\r\n            <i class="fa fa-refresh fa-lg pull-left"></i>\r\n            <div>\r\n                Die letzte Version der Datei ersetzen<br />\r\n                <small>Alle mit der letzten Version verknüpften Inhalte werden die neue Datei verwenden.</small>\r\n            </div>\r\n        </button>\r\n\r\n        <button class="btn btn-default btn-lg btn-block text-left" data-bind="click: cancel">\r\n            <i class="fa fa-times fa-lg pull-left"></i>\r\n            <div>\r\n                Abbrechen<br />\r\n                <small>Es werden keine Dateien übertragen.</small>\r\n            </div>\r\n        </button>\r\n    </div>\r\n</div>';});

define('text!modules/contentfile/views/index.html',[],function () { return '<div id="files-index" class="app-page bottom-fixed-navbar-container" data-bind="scrollTop: { observable: scrollTop, enabled: isInteractive }">\r\n\r\n    <div class="panel-padding-h subnav-fixed-top-container">\r\n        <div id="files-toolbar" class="toolbar row subnav-fixed-top">\r\n            <div class="col-md-offset-6 col-md-6 col-lg-offset-8 col-lg-4">\r\n                <!-- ko compose: searchControl --><!-- /ko -->\r\n            </div>\r\n        </div>\r\n\r\n        <div id="drop-zone" data-bind="click: resetSelectedItem, forceViewportHeight: { minWidth: 992 }">\r\n\r\n            <div class="row thumbnails-fixed-size" data-bind="lazyLoad: { data: list.items(), loadHandler: loadHandler }">\r\n                <div class="col-sm-6 col-md-3 col-lg-2">\r\n                    <div class="thumbnail-container" data-bind="css: { \'item-checked\': isSelected, \'item-selected\': isSelectedItem  }">\r\n                        <a href="#" class="thumbnail" data-bind="doubleTap: true, event: { dbltap: $parent.showDetail }, click: selectItem, clickBubble: false">\r\n                            <!-- ko if: data() -->\r\n                            <!-- ko template: { name: \'dbfile-icon\', data: data() } --><!-- /ko -->\r\n                            <!-- /ko -->\r\n                            <!-- ko if: isUploading() -->\r\n                            <span><i class="fa fa-spinner fa-spin fa-4x"></i></span>\r\n                            <!-- /ko -->\r\n                        </a>\r\n                        <!-- ko if: data() -->\r\n                        <div class="item-check" data-bind="click: toggleSelected, clickBubble: false, attr: { title: data().FileName() + \' auswählen\' }">\r\n                            <i class="fa" data-bind="css: { \'fa-check-square-o\': isSelected, \'fa-square-o\': !isSelected() }"></i>\r\n                        </div>\r\n                        <!-- /ko -->\r\n                        <div class="thumbnail-label">\r\n                            <!-- ko if: data() -->\r\n                            <div class="pull-right">\r\n                                <a class="btn-link" data-bind="click: $parent.deleteFile, clickBubble: false, attr: { title: data().FileName() + \' löschen\' }"><i class="fa fa-trash-o"></i></a>\r\n                            </div>\r\n                            <span class="thumbnail-label-content" data-bind="text: data().FileName, attr: { title: data().FileName }"></span>\r\n                            <!-- /ko -->\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <div class="drop-zone-placeholder" data-bind="visible: list.count() == 0 && !isLoading()">\r\n                <p data-bind="if: (window.FileReader && Modernizr.draganddrop)">\r\n                    <!-- ko if: (window.FileReader && Modernizr.draganddrop) -->\r\n                    Füge Dateien hinzu, indem Du sie hier per Drag and Drop ablegst oder unten auf "Dateien hinzufügen" klickst.\r\n                    <!-- /ko -->\r\n                    <!-- ko if: !(window.FileReader && Modernizr.draganddrop) -->\r\n                    Füge Dateien hinzu, indem Du unten auf "Dateien hinzufügen" klickst.\r\n                    <!-- /ko -->\r\n                </p>\r\n            </div>\r\n        </div>\r\n\r\n        <div class="navbar navbar-default navbar-fixed-bottom">\r\n            <div class="navbar-panel pull-left">\r\n                <ul class="nav navbar-nav">\r\n                    <li>\r\n                        <a class="btn-fileinput">\r\n                            <span><i class="fa fa-plus"></i> Dateien hinzufügen</span>\r\n                            <!-- ko with: uploadManager -->\r\n                            <input type="file" name="files" data-url="~/api/DbFileUpload"\r\n                                   data-bind="fileupload: { change: filesSelected, add: addFiles, done: uploadDone, fail: uploadFailed, progressall: uploadProgress, drop: filesDropped, dropZone: $(\'#drop-zone\') }" multiple>\r\n                            <!-- /ko -->\r\n                        </a>\r\n                    </li>\r\n                    <li>\r\n                        <a href="#" data-bind="click: showSelectedFile, visible: selectedFile()">\r\n                            <i class="fa fa-arrow-right"></i> Details\r\n                        </a>\r\n                    </li>\r\n                    <li data-bind="visible: selectedFiles().length > 0">\r\n                        <a href="#" data-bind="click: deleteSelection">\r\n                            <i class="fa fa-times"></i> Auswahl löschen\r\n                        </a>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n\r\n            <div class="navbar-panel pull-right">\r\n                <div class="navbar-text" data-bind="visible: uploadManager.isUploading">\r\n                    Upload: <span data-bind="text: uploadManager.progress"></span> %\r\n                </div>\r\n\r\n                <div class="navbar-text hidden-sm">\r\n                    <!-- ko if: selectedFiles().length > 0 -->\r\n                    <span data-bind="text: selectedFiles().length"></span> Dateien ausgewählt\r\n                    <!-- /ko -->\r\n                    <!-- ko if: selectedFiles().length <= 0 && selectedFile() && selectedFile().data() -->\r\n                    <span data-bind="text: selectedFile().data().FileName"></span>\r\n                    <!-- /ko -->\r\n                </div>\r\n\r\n                <div class="navbar-text">\r\n                    <span data-bind="text: list.count()"></span> Dateien\r\n                </div>\r\n                <ul class="nav navbar-nav">\r\n                    <li>\r\n                        <a href="#" title="Aktualisieren" data-bind="click: refresh"><i class="fa fa-refresh fa-fw" data-bind="css: { \'fa-spin\': isLoading }"></i></a>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n<script type="text/html" id="dbfile-icon">\r\n    <!-- ko if: isImage() && latestVersion() -->\r\n    <img data-bind="attr: { src: $root.server.mapPath(\'~/content/images/blank.gif\'), \'data-src\': $root.server.mapPath(\'~/DbFileContent/Thumbnail/\' + latestVersion().Id() + \'?thumbnailName=220x160&h=\' + latestVersion().Hash()), alt: FileName }, lazyImage: true" />\r\n    <!-- /ko -->\r\n    <!-- ko if: !isImage() -->\r\n    <span><i class="fa fa-file fa-4x"></i></span>\r\n    <!-- /ko -->\r\n</script>';});

define('modules/draft/commands/deleteDraft',["durandal/system","durandal/app","entityManagerProvider","breeze","ko"],function(e,t,n,r,i){function a(){var e=this;e.manager=n.createManager(),e.isExecuting=i.observable(!1)}var o=r.EntityQuery;return a.prototype.canExecute=function(){return!this.isExecuting()},a.prototype.execute=function(e){var t=this;if(t.canExecute(e))return t.isExecuting(!0),t.deleteDraft(e).then(function(){t.isExecuting(!1)})},a.prototype.deleteDraft=function(n){var r=this;return e.defer(function(e){var i=(new o).from("Drafts").where("Id","==",n).expand("Translations, ContentParts.Resources, Files.Resources.FileVersion.File");r.manager.executeQuery(i).then(function(i){var a="Entwurf löschen",o="Abbrechen",s=i.results[0];t.showMessage('Soll der Entwurf "'+s.Name()+'" wirklich gelöscht werden?',"Entwurf löschen",[a,o]).then(function(i){return i===a?(s.setDeleted(),r.manager.saveChanges().then(function(){t.trigger("caps:draft:deleted",n)}).then(e.resolve).fail(e.reject)):(e.resolve(),void 0)})}).fail(e.reject)}).promise()},a});
define('modules/draft/contentGenerator',["ko","markdown","infrastructure/urlHelper","infrastructure/contentReferences","infrastructure/contentControls"],function(e,t,n,r,i){function a(e,t){var n=this;n.name=e,n.rows=t}function o(e){var t=this;t.cells=e}function s(e,t,n,r){var i=this;i.name=e,i.title=t,i.colspan=n,i.content=r}function l(t,n){var r=t.deserializeTemplate();return r?new a(r.name,e.utils.arrayMap(r.rows,function(r){return new o(e.utils.arrayMap(r.cells,function(e){var r=c(t,e,n);return new s(e.name,e.title,e.colspan,r)}))})):new a}function c(e,t,n){var r=d(e,t,n);return r=x.replaceReferences(e,r,n),r=i.replaceContentControls(r)}function d(e,t,n){var r=e.findContentPart(t.name);return r?u(r,n):""}function u(e,t){var n=e.getResource(t);return f(n,t)}function f(e){var t=e.Content(),n=e.ContentPart();return t=p(n.ContentType(),t)}function p(e,t){return"markdown"===e.toLowerCase()?(k=k||new Markdown.Converter,k.makeHtml(t)):"text"===e.toLowerCase()?"<pre>"+t+"</pre>":t}function h(e){return{entityType:"Draft",entityId:e.Id(),version:e.Version(),name:e.Name(),template:e.Template(),created:m(e.Created()),modified:m(e.Modified()),resources:v(e),contentParts:g(e),files:y(e)}}function m(e){return{at:e.At(),by:e.By()}}function v(t){var n=e.utils.arrayMap(t.Translations(),function(e){return{language:e.Language(),title:e.TranslatedName(),created:m(e.Created()),modified:m(e.Modified())}});return n.push({language:t.OriginalLanguage(),title:t.Name(),created:m(t.Created()),modified:m(t.Modified())}),n}function g(t){return e.utils.arrayMap(t.ContentParts(),function(e){return{name:e.Name(),contentType:e.ContentType(),ranking:e.Ranking(),resources:b(t,e.Resources())}})}function b(t,n){return e.utils.arrayMap(n,function(e){return{language:e.Language(),content:f(e,e.Language())}})}function y(t){return e.utils.arrayMap(t.Files(),function(e){return{name:e.Name(),isEmbedded:e.IsEmbedded(),determination:e.Determination(),group:e.Group(),ranking:e.Ranking(),resources:w(e.Resources())}})}function w(t){return e.utils.arrayMap(t,function(e){return{language:e.Language(),dbFileVersionId:e.DbFileVersionId(),title:e.Title(),description:e.Description(),credits:e.Credits()}})}var k,x=new r({replaceFileReference:function(e,t){var r=e.context,i=r.findDraftFile(e.fileName),a=i?i.getResource(t):void 0,o=a?a.FileVersion():void 0;return o?n.getFileUrl(e.fileName,o,e.query):""},replacePublicationReference:function(e,t){return n.getPublicationUrl(e.id,t,e.query)}});return{TemplateContent:a,TemplateContentRow:o,TemplateContentCell:s,createTemplateContent:l,createTemplateCellContent:c,createPublicationContent:h}});
define('modules/draft/entities',["require","ko","durandal/system"],function(e,t,n){function r(){}function i(e){e.Name.extend({required:!0}),e.template=t.computed({read:function(){return e.deserializeTemplate()},deferEvaluation:!0}),e.fileGroupNames=t.computed(function(){return t.utils.arrayMap(e.Files(),function(e){return e.Group()||""})}),e.distinctFileGroupNames=t.computed(function(){return t.utils.arrayGetDistinctValues(e.fileGroupNames())}),e.orderedFiles=t.computed(function(){function t(e,t){return e.Group()===t.Group()?0:e.Group()<=t.Group()?-1:1}function n(e,t){return e.Ranking()===t.Ranking()?0:e.Ranking()<=t.Ranking()?-1:1}var r=e.Files();return r.sort(function(e,r){return e.Group()!==r.Group()?t(e,r):n(e,r)}),r}),e.statusTitle=t.computed(function(){if(!e.Status())return"";var n=e.Status().toLowerCase(),r=t.utils.arrayFirst(c,function(e){return e.value.toLowerCase()===n});return r?r.title:""})}function a(e){return e.findCell=function(t){var n;return e.forEachCell(function(e,r){return r.name.toLowerCase()===t.toLowerCase()?(n=r,!1):void 0}),n},e.findCellIndex=function(t){var n=0;return e.forEachCell(function(e,r,i){return r===t?(n=i,!1):void 0}),n},e.forEachCell=function(t){for(var n=1,r=!1,i=0;i<e.rows.length&&!r;i++)for(var a=e.rows[i],o=0;o<a.cells.length;o++){var s=a.cells[o];if(t.call(e,a,s,n++)===!1){r=!0;break}}},e}function o(){}function s(e){e.templateCellIndex=t.computed({read:function(){var t=0,n=e.findTemplateCell();return n&&(t=e.Draft().template().findCellIndex(n)),t},deferEvaluation:!0})}function l(){}var c=[{value:"NEW",title:"In Arbeit"},{value:"RFT",title:"Bereit zur Übersetzung"},{value:"RFP",title:"Bereit zur Veröffentlichung"}];return r.prototype.getTranslation=function(e){var n=e.toLowerCase();return t.utils.arrayFirst(this.Translations(),function(e){return e.Language().toLowerCase()===n})},r.prototype.getOrCreateTranslation=function(e,t){var n=e.toLowerCase(),r=this.getTranslation(e);return r?r:(r=t.createEntity("DraftTranslation",{DraftId:this.Id(),Language:n}),t.addEntity(r),this.Translations.push(r),r)},r.prototype.findContentPart=function(e){var n=t.utils.arrayFirst(this.ContentParts(),function(t){return t.Name().toLowerCase()===e.toLowerCase()});return n},r.prototype.findDraftFile=function(e,n){n=n||"de";var r=e.toLowerCase(),i=t.utils.arrayFirst(this.Files(),function(e){var t=e.getResource(n);return t?t.FileVersion()&&t.FileVersion().File().FileName().toLowerCase()===r:!1});return i},r.prototype.deserializeTemplate=function(){var e;try{e=JSON.parse(this.Template())}catch(t){n.log(t.message)}return e?(a(e),e):void 0},r.prototype.setDeleted=function(){for(;this.Translations().length;)this.Translations()[0].entityAspect.setDeleted();for(;this.ContentParts().length;)this.ContentParts()[0].setDeleted();for(;this.Files().length;)this.Files()[0].setDeleted();this.entityAspect.setDeleted()},r.prototype.filesByGroupName=function(e){var n=t.utils.arrayFilter(this.orderedFiles(),function(t){var n=t.Group()||"";return n.toLowerCase()===e.toLowerCase()});return n},r.prototype.rankingByGroupName=function(e){var n=t.utils.arrayFilter(this.orderedFiles(),function(t){var n=t.Group()||"";return n.toLowerCase()===e.toLowerCase()});return n.length>0?n[0].Ranking():1e4},r.prototype.filesByDetermination=function(e){var n=t.utils.arrayFilter(this.Files(),function(t){var n=t.Determination()||"";return n.toLowerCase()===e.toLowerCase()});return n},r.prototype.hasValidationErrors=function(){var e=this;return e.entityAspect.hasValidationErrors?!0:t.utils.arrayFirst(e.Files(),function(e){return e.entityAspect.hasValidationErrors})?!0:t.utils.arrayFirst(e.Translations(),function(e){return e.entityAspect.hasValidationErrors})?!0:t.utils.arrayFirst(e.ContentParts(),function(e){return e.entityAspect.hasValidationErrors?!0:t.utils.arrayFirst(e.Resources,function(e){return e.entityAspect.hasValidationErrors})?!0:!1})?!0:!1},o.prototype.getResource=function(e){var n=e.toLowerCase();return t.utils.arrayFirst(this.Resources(),function(e){return e.Language().toLowerCase()===n})},o.prototype.getOrCreateResource=function(e,t){var n=e.toLowerCase(),r=this.getResource(e);return r?r:(r=t.createEntity("DraftContentPartResource",{DraftContentPartId:this.Draft().Id(),Language:n,Content:""}),t.addEntity(r),this.Resources.push(r),r)},o.prototype.setDeleted=function(){for(;this.Resources().length;)this.Resources()[0].entityAspect.setDeleted();this.entityAspect.setDeleted()},o.prototype.previewText=function(e,t){e=e||"de",t=t||80;var n=this.localeContent(e);return n?n.length>t?n.substr(0,t-3)+"...":n:""},o.prototype.localeContent=function(e){e=e||"de";var t=this.getResource(e);return t&&t.Content()?t.Content():""},o.prototype.findTemplateCell=function(){var e=this;if(!e.Draft()||!e.Draft().template())return null;var t=e.Draft().template(),n=t.findCell(e.Name());return n},l.prototype.setDeleted=function(){for(;this.Resources().length;)this.Resources()[0].entityAspect.setDeleted();this.entityAspect.setDeleted()},l.prototype.getResource=function(e){var n=e.toLowerCase();return t.utils.arrayFirst(this.Resources(),function(e){return e.Language().toLowerCase()===n})},l.prototype.getOrCreateResource=function(e,t){var n=e.toLowerCase(),r=this.getResource(e);return r?r:(r=t.createEntity("DraftFileResource",{DraftFileId:this.Id(),Language:n}),t.addEntity(r),this.Resources.push(r),r)},{Draft:r,DraftContentPart:o,supportedDraftStates:c,extendModel:function(e){e.registerEntityTypeCtor("Draft",r,i),e.registerEntityTypeCtor("DraftContentPart",o,s),e.registerEntityTypeCtor("DraftFile",l)},initializeTemplate:a}});
define('modules/draft/datacontext',["durandal/system","entityManagerProvider","ko","infrastructure/userQueryParser","./entities"],function(e,n,r,i,a){function o(){var e=p.from("Drafts");return f.executeQuery(e)}function s(e,t){var n=p.from("Drafts");if(e&&e.length){var r=h.getBreezePredicate(e);r&&(n=n.where(r))}return n=n.orderBy(t||"Created.At desc"),f.executeQuery(n)}function l(e){var t=(new p).from("Drafts").where("Id","==",e).expand("Translations, ContentParts.Resources, Files.Resources.FileVersion.File");return f.executeQuery(t)}function c(n){return e.defer(function(e){var r=(new p).from("DraftTemplates").where("Name","==",n);f.executeQuery(r).then(function(n){n.results&&n.results.length||e.resolve(null);try{t=JSON.parse(n.results[0].TemplateContent()),a.initializeTemplate(t)}catch(r){e.reject(r)}e.resolve(t)}).fail(e.reject)}).promise()}function d(t,n){return n=n||f,e.defer(function(e){var r=new breeze.Predicate("Content.EntityType","==","Draft").and("Content.EntityKey","==",t.toString()),i=(new p).from("SiteMapNodes").where(r).expand("Content, SiteMap, SiteMap.SiteMapNodes, SiteMap.SiteMapNodes.Resources");n.executeQuery(i).then(function(t){e.resolve(t.results)}).fail(e.reject)}).promise()}function u(e){var t=(new p).from("DraftFiles").where("Id","==",e.Id()),n=f.executeQueryLocally(t);n&&n.length&&n.forEach(function(e){e.Resources()&&e.Resources().forEach(function(e){f.detachEntity(e)}),f.detachEntity(e)})}var f=n.createManager(),p=breeze.EntityQuery,h=new i;return h.translateColumnName=function(){return"Name"},{getDrafts:o,getDraft:l,getTemplate:c,fetchPublications:d,searchDrafts:s,detachDraftFile:u,isValidUserQuery:function(e){return h.validate(e)}}});
define('text!modules/draft/module.html',[],function () { return '<div id="draftModule">\r\n    <!--ko router: { transition:\'entrance\', cacheViews:true }--><!--/ko-->\r\n</div>';});

define('modules/draft/module',["infrastructure/moduleFactory","infrastructure/moduleRouter","./entities","durandal/app","durandal/composition"],function(e,t,n,r){function i(e){e.bindingHandlers.draftTemplateClass={init:function(t,n){var r=e.unwrap(n()),i=$(t);i.addClass("col-md-"+r.colspan)},update:function(t,n){var r=e.unwrap(n());$(t).addClass("col-md-"+r.colspan)}}}var a=e.createModule({route:"drafts*details",moduleId:"modules/draft/module",title:"Inhalte",nav:20,hash:"#drafts"});return a.extendModel=n.extendModel,a.initializeRouter=function(){a.router=t.createModuleRouter(a,"modules/draft","drafts").map([{route:"",moduleId:"viewmodels/index",title:"Inhalte",nav:!1},{route:"create",moduleId:"viewmodels/templateGallery",title:"Vorlage wählen",nav:!1},{route:"create/:templateName",moduleId:"viewmodels/editor/editor",title:"Neuer Inhalt",nav:!1},{route:"edit/:draftId",moduleId:"viewmodels/editor/editor",title:"Inhalt bearbeiten",nav:!1},{route:"translate/:draftId/:language",moduleId:"viewmodels/translator/translator",title:"Übersetzung",nav:!1}]).buildNavigationModel()},r.on("caps:started",function(){require(["ko","modules/draft/viewmodels/draftSelectionDialog"],function(e,t){i(e),t.install()})}),a.editDraft=function(e){a.router.navigate("#drafts/edit/"+e)},r.registerContentEditor("Draft",a,a.editDraft),r.on("caps:contentfile:navigateToResourceOwner",function(e){e.DraftFile&&a.router.navigate("#drafts/edit/"+e.DraftFile().DraftId())}),a});
define('modules/draft/stockTemplates',["ko","./entities"],function(e,t){function n(){return i||(i=r()),i}function r(){function e(e,t){return{name:e,rows:t}}function n(e){return{cells:e}}function r(e,t,n,r){return r=r||"markdown",{name:e,title:t,colspan:n,contentType:r}}var i=[];return i.push(e("Template 1",[n([r("Header","Kopfbereich",12)]),n([r("Main","Hauptteil",8),r("Sidebar","Zusatzinformationen",4)]),n([r("Footer","Fußbereich",12)])])),i.push(e("Template 2",[n([r("Header","Kopfbereich",12)]),n([r("Main","Hauptteil",8),r("Sidebar","Zusatzinformationen",4)])])),i.push(e("Template 3",[n([r("Header","Kopfbereich",12,"html")]),n([r("Main","Hauptteil",12,"text")])])),i.forEach(function(e){t.initializeTemplate(e)}),i}var i=null;return{all:n}});
define('modules/sitemap/datacontext',["entityManagerProvider","breeze","durandal/system"],function(e,t,n){function r(e){var t=h.createEntity("DbSiteMap",{WebsiteId:e.Id(),Version:1}),n=h.createEntity("DbSiteMapNode",{NodeType:"ROOT",Name:"HOME"}),r=n.getOrCreateResource("de",h);return n.SiteMapId(t.Id()),r.Title("Startseite"),h.addEntity(n),t}function i(e){return n.defer(function(t){e||t.reject(new Error("No website provided."));var n,i=e.latestSiteMap(),a=i?i.Version()+1:1;n=i?i.createNewVersion(a,h):r(e),h.saveChanges().then(function(){t.resolve(n)}).fail(t.reject)}).promise()}function a(e){return n.defer(function(t){e.setDeleted(),h.saveChanges().then(t.resolve).fail(t.reject)}).promise()}function o(e,t){return e.PublishedFrom(new Date),e.PublishedBy(t),h.saveChanges()}function s(e,t){return n.defer(function(n){e||n.reject(new Error("No siteMap provided")),t||n.reject(new Error("No parentNode provided"));var r=h.createEntity("DbSiteMapNode",{NodeType:"PAGE"});h.addEntity(r),r.ParentNodeId(t.Id()),r.SiteMapId(e.Id());var i=r.getOrCreateResource("de",h);i.Title("Seite "+(new Date).toLocaleTimeString()),h.saveChanges().then(function(){n.resolve(r)}).fail(n.reject)}).promise()}function l(e){return e.setDeleted(),h.saveChanges()}function u(e){return n.defer(function(t){var n=(new m).from("Publications").where("Id","==",e).expand("Translations, ContentParts.Resources, Files.Resources.FileVersion.File");h.executeQuery(n).then(function(e){t.resolve(e.results[0])}).fail(t.reject)}).promise()}function c(){var e=(new m).from("Websites").expand("SiteMapVersions").take(1);return h.executeQuery(e)}function d(e){var t=(new m).from("SiteMapNodes").where("Id","==",e).expand("Resources");return h.executeQuery(t)}function f(e){var t=(new m).from("SiteMapNodes").where("ContentId","==",e).expand("SiteMap.Website.SiteMapVersions");return h.executeQuery(t)}function p(e){var t=new m("SiteMapNodes").where("SiteMapId","==",e).expand("Resources");return h.executeQuery(t)}var h=e.createManager(),m=t.EntityQuery;return{createInitialSiteMap:r,createNewSiteMapVersion:i,deleteSiteMapVersion:a,publishSiteMap:o,createSiteMapNode:s,deleteSiteMapNode:l,fetchPublication:u,fetchFirstWebsite:c,fetchSiteMapNode:d,fetchSiteMapNodes:p,fetchSiteMapNodeByContentId:f,saveChanges:function(){return h.saveChanges()}}});
define('modules/sitemap/viewmodels/siteMapViewModel',["ko","moment","breeze","durandal/system","infrastructure/treeViewModel","../datacontext"],function(e,t,n,r,i,a){function o(n){var r=this;r.entity=e.observable(n),r.tree=e.observable(),r.publishedFromNow=e.computed(function(){return t.utc(r.entity().PublishedFrom()).fromNow()}),r.title=e.computed(function(){return"Version "+r.entity().Version()})}return n.EntityQuery,o.prototype.fetchTree=function(){var e=this;return r.defer(function(t){a.fetchSiteMapNodes(e.entity().Id()).then(function(){e.buildTree(),t.resolve()}).fail(t.reject)}).promise()},o.prototype.buildTree=function(){function t(n,r){var i=e.utils.arrayFilter(r,function(e){return!e.isTeaser()});e.utils.arrayForEach(i,function(e){var r=a.createNode();r.entity(e),n.addChildNode(r),t(r,e.childNodes())})}var n=this,r=n.entity(),a=new i.TreeViewModel;a.keyName("Id"),t(a.root,r.rootNodes()),a.expandRootNodes(),a.selectedNode.subscribe(function(){n.selectedNodeChanged.call(n,a.selectedNode())}),n.tree(a)},o.prototype.selectedNodeChanged=function(){},o.prototype.refreshTree=function(){var e=this.entity(),t=[];this.tree()&&(t=this.tree().saveState()),this.buildTree(e),this.tree()&&t&&this.tree().restoreState(t)},o.prototype.selectNodeByKey=function(e){this.tree()&&this.tree().selectNodeByKey(e)},o.prototype.selectRootNode=function(){if(this.tree()){var e=this.tree().rootNodes(),t=e.length?e[0]:void 0;t&&this.tree().selectedNode(t)}},o.prototype.containsNode=function(e){return e&&this.entity().containsNode(e)},o});
define('modules/sitemap/viewmodels/siteMapTree',["ko","durandal/system","entityManagerProvider","breeze","./siteMapViewModel"],function(e,t,n,r,i){function a(r){var a=this,s=n.createManager();r=r||{},a.manager=s,a.website=e.observable(),a.selectedSiteMap=e.observable(),a.selectedNode=e.observable(),a.siteMapSelectionEnabled=e.observable(r.canSelectSiteMap!==!1),a.selectedSiteMap.subscribe(function(e){function t(e){var t=new o("SiteMapNodes").where("SiteMapId","==",e).expand("Resources");return a.manager.executeQuery(t)}a.selectedNode(null),e&&t(e.entity().Id()).then(function(){e.buildTree(),e.entity().rootNodes().length&&e.selectNodeByKey(e.entity().rootNodes()[0].Id())})}),a.siteMaps=e.computed(function(){var t=a.website()?a.website().sortedSiteMapVersions():[];return e.utils.arrayMap(t,function(e){var t=new i(e,s);return t.selectedNodeChanged=function(e){e&&a.selectedNode(e.entity())},t})}),a.findSiteMap=function(t){return e.utils.arrayFirst(a.siteMaps(),function(e){return e.entity()===t})},a.isNodeEnabled=function(e){return r.nodeFilter&&t.isFunction(r.nodeFilter)?r.nodeFilter.call(a,e):!0}}var o=r.EntityQuery;return a.prototype.fetchSiteMapVersions=function(){var e=this,t=(new o).from("Websites").expand("SiteMapVersions");return e.manager.executeQuery(t).then(function(t){e.website(t.results[0]),e.selectedSiteMap(e.findSiteMap(e.website().latestSiteMap()))})},a});
define('modules/draft/viewmodels/draftPublicationViewModel',["ko","moment","../contentGenerator","infrastructure/publicationService"],function(e,t,n,r){function i(i,a){var o=this;o.draft=e.observable(i),o.sitemapNode=e.observable(a),o.title=e.computed(function(){return o.sitemapNode().path()}),o.contentVersion=e.computed(function(){return o.sitemapNode().Content()?"v."+o.sitemapNode().Content().ContentVersion():""}),o.createdAt=e.computed(function(){return t.utc(o.sitemapNode().Created().At()).fromNow()}),o.createdBy=e.computed(function(){return o.sitemapNode().Created().By()}),o.modifiedAt=e.computed(function(){return o.sitemapNode().Content()?t.utc(o.sitemapNode().Content().ContentDate()).fromNow():""}),o.modifiedBy=e.computed(function(){return o.sitemapNode().Content()?o.sitemapNode().Content().AuthorName():""}),o.isOutdated=e.computed(function(){return o.sitemapNode().Content()?o.sitemapNode().Content().ContentVersion()<o.draft().Version():!1}),o.republish=function(){var e=n.createPublicationContent(this.draft());r.republish(this.sitemapNode().Id(),e)}}return i});
define('modules/draft/viewmodels/draftPublicationDialog',["durandal/system","plugins/dialog","ko","modules/sitemap/viewmodels/siteMapTree","../datacontext","./draftPublicationViewModel","../contentGenerator","infrastructure/publicationService"],function(e,t,n,r,i,a,o,s){function l(e){var t=this;t.draft=n.observable(e),t.siteMapTree=new r,t.publications=n.observableArray(),t.hasOutdatedPublications=n.computed(function(){for(var e=t.publications(),n=0;n<e.length;n++)if(e[0].isOutdated())return!0;return!1})}return l.prototype.activate=function(){function t(t){return e.defer(function(e){i.fetchPublications(t.Id()).then(function(r){e.resolve(n.utils.arrayMap(r,function(e){return new a(t,e)}))}).fail(e.reject)}).promise()}var r=this,o=r.draft();r.siteMapTree.fetchSiteMapVersions(),t(o).then(function(e){r.publications(e)})},l.prototype.selectOk=function(){var e=this;try{var n=o.createPublicationContent(e.draft());s.publish(n,e.siteMapTree.selectedNode()).then(function(){t.close(e,{dialogResult:!0})}).fail(function(e){alert(e.message)})}catch(r){alert(r.message)}},l.prototype.selectCancel=function(){t.close(this,{dialogResult:!1})},l});
define('modules/draft/viewmodels/draftSearchControl',["ko","../datacontext","infrastructure/listSortModel"],function(e,t,n){function r(){var n=this;n.searchWords=e.observable(""),n.sortOptions=n.createSortOptions(),n.search=function(){return n.searchWords()&&n.searchWords().length&&!t.isValidUserQuery(n.searchWords())?!1:(n.refreshResults(),void 0)}}return r.prototype.createSortOptions=function(){var e=this,t=[new n.ListColumn("Created.At","Erstellt am"),new n.ListColumn("Created.By","Erstellt von"),new n.ListColumn("Modified.At","Letzte Änderung"),new n.ListColumn("Modified.By","Letzte Änderung von"),new n.ListColumn("Name","Name")];return new n.SortOptions(t,function(){e.refreshResults()},"Modified.At")},r.prototype.refreshResults=function(){},r});
define('modules/draft/viewmodels/draftSelectionDialog',["plugins/dialog","ko","../datacontext","./draftSearchControl","moment","../contentGenerator"],function(e,t,n,r,i,a){function o(){var e=this;e.searchControl=new r,e.searchControl.refreshResults=function(){e.refresh()},e.isLoading=t.observable(),e.listItems=t.observableArray(),e.selectedItem=t.observable(),e.okTitle=t.observable("Inhalt festlegen"),e.refresh()}function s(e,n){var r=this;r.entity=e,r.createdAt=t.computed(function(){return i(r.entity.Created().At()).calendar()}),r.modifiedAt=t.computed(function(){return i(r.entity.Modified().At()).fromNow()}),r.isSelected=t.computed(function(){return n()===r}),r.selectItem=function(){n(r)}}return o.prototype.refresh=function(){var e=this,r=e.searchControl;return e.isLoading(!0),n.searchDrafts(r.searchWords(),r.sortOptions.getOrderBy()).then(function(n){var r=t.utils.arrayMap(n.results,function(t){return new s(t,e.selectedItem)});e.listItems(r),e.isLoading(!1)})},o.prototype.selectOk=function(){function t(t){e.close(r,{dialogResult:!0,selectedContent:t})}var r=this;r.selectedItem()&&n.getDraft(r.selectedItem().entity.Id()).then(function(e){var n=a.createPublicationContent(e.results[0]);t(n)})},o.prototype.selectCancel=function(){e.close(this,{dialogResult:!1})},o.install=function(){require(["plugins/contentSelection"],function(e){e.registerDialog("Draft",o)})},o});
define('modules/draft/viewmodels/editor/contentEditors/htmlEditor',[],function(){function e(){}return e});
define('modules/draft/viewmodels/editor/contentEditors/insertImageDialog',["durandal/app","plugins/dialog"],function(e,t){function n(e,n,r){function i(){s.selectedFile()?s.imageUrl(a(s.selectedFile().fileName,s.thumbnail(),s.thumbnailWidth(),s.thumbnailHeight())):s.imageUrl("")}function a(e,t,n,r){var i="caps://content-file/"+encodeURIComponent(e);return t&&(i+="?size="+(n||0)+"x"+(r||0)),i}function o(e){var t=e.getResource("de"),n=t.FileVersion().File().FileName(),r={file:e,fileName:n,resource:t,link:a(n)};return r.isSelected=ko.computed(function(){return s.selectedFile()===r}),r}var s=this;if(s.draft=n,s.selectedFile=ko.observable(),s.imageUrl=ko.observable(),s.thumbnail=ko.observable(!1),s.thumbnail.subscribe(i),s.thumbnailWidth=ko.observable(300),s.thumbnailWidth.subscribe(i),s.thumbnailHeight=ko.observable(300),s.thumbnailHeight.subscribe(i),s.files=ko.computed({read:function(){return ko.utils.arrayMap(n.Files(),o)},deferEvaluation:!0}),s.selectFile=function(e){s.selectedFile(e),i()},s.ok=function(){t.close(s,{result:!0,url:s.imageUrl()})},s.cancel=function(){t.close(s,{result:!1})},s.addFiles=function(){t.close(s,{result:!1,addFiles:!0})},r){var l=ko.utils.arrayFirst(s.files(),function(e){return e.file===r});s.selectFile(l)}}return n});
define('modules/draft/viewmodels/editor/contentEditors/insertLinkDialog',["plugins/dialog"],function(e){function t(){var t=this;t.ok=function(){e.close(t,{result:!0,url:"http://www.xyz.de"})},t.cancel=function(){e.close(t,{result:!1})}}return t});
define('modules/draft/viewmodels/editor/contentEditors/markdownEditor',["durandal/app","ko","jquery","./insertLinkDialog","./insertImageDialog","../../../module","Q"],function(e,t,n,r,i,a,o){function s(){var s=this;s.insertLink=function(t){var n=new r;return e.showDialog(n).then(function(e){e.result?t(e.url):t(null)}),!0},s.insertPicture=function(r,l){var c=new i(s.editor,s.editor.entity(),l);return e.showDialog(c).then(function(i){i.result?r(i.url):i.addFiles?(n(".wmd-prompt-background").hide(),e.selectFiles({module:a,title:'Dateien zu Entwurf "'+s.editor.entity().Name()+'" hinzufügen'}).then(function(e){if(e.dialogResult){var i=t.utils.arrayMap(e.selectedFiles,function(e){return s.editor.createDraftFile(e)});n(".wmd-prompt-background").show(),o.all(i).then(function(e){s.insertPicture(r,e[0])})}else r(null)})):r(null)}),!0},s.showHelp=function(){alert("help?")}}var l={bold:"Fett <strong> Ctrl+B",boldexample:"fetter Text",italic:"Hervorhebung <em> Ctrl+I",italicexample:"hervorgehobener Text",link:"Link <a> Ctrl+L",linkdescription:"Link-Text hier einfügen",linkdialog:"",quote:"Zitat <blockquote> Ctrl+Q",quoteexample:"Zitat",code:"Code Beispiel <pre><code> Ctrl+K",codeexample:"Code hier einfügen",image:"Bild <img> Ctrl+G",imagedescription:"Bild-Beschreibung hier einfügen",imagedialog:"",olist:"Nummerierte Liste <ol> Ctrl+O",ulist:"Liste <ul> Ctrl+U",litem:"Listen-Element",heading:"Überschrift <h1>/<h2> Ctrl+H",headingexample:"Überschrift",hr:"Horizontale Linie <hr> Ctrl+R",undo:"Rückgängig - Ctrl+Z",redo:"Wiederholen - Ctrl+Y",redomac:"Wiederholen - Ctrl+Shift+Z",help:"Markdown Hilfe"};return t.bindingHandlers.pagedownEditor={init:function(e,r){var i=t.unwrap(r()),a=n(e),o=a.children("textarea")[0],s=a.find(".wmd-toolbar")[0],c=a.find(".wmd-preview")[0],u=n(o),d=n(s),f=n(c),p="-"+new String(i.contentPart.Id()).replace("-","neg"),h=new Markdown.Converter;u.attr("id","wmd-input"+p),d.attr("id","wmd-button-bar"+p),f.attr("id","wmd-preview"+p);var m={strings:l},v=new Markdown.Editor(h,p,m);u.val(i.content()),v.hooks.onPreviewRefresh=function(e){var t=u.val();return i.content(t),e},v.hooks.insertImageDialog=i.insertPicture,v.hooks.insertLinkDialog=i.insertLink,v.run()}},s});
define('modules/draft/viewmodels/editor/contentEditors/textEditor',[],function(){function e(){}return e});
define('modules/draft/viewmodels/editor/contentPartEditor',["require","ko","../../contentGenerator"],function(e,t,n){function r(r,o){function s(t){i[t]&&e([i[t]],function(e){var t=new e;t.editor=r,t.contentPart=o,t.content=l.resource.Content,l.contentEditor(t)})}var l=this;l.name="ContentPartEditor",l.editor=r,l.showPreview=t.observable(!1),l.contentPart=o,l.resource=o.getResource("de"),l.contentTypes=t.observableArray([{title:"HTML",value:"html"},{title:"Markdown",value:"markdown"},{title:"Text",value:"text"}]),l.contentEditor=t.observable(),l.templateCell=r.template().findCell(o.Name()),l.title=l.templateCell?l.templateCell.title:o.Name(),s(o.ContentType()),o.ContentType.subscribe(s),l.togglePreview=function(){l.previewContent(n.createTemplateCellContent(l.editor.entity(),l.templateCell,l.resource.Language())),l.showPreview(!l.showPreview()),a.trigger("forceViewportHeight:refresh")},l.previewContent=t.observable()}var i={text:"./contentEditors/textEditor",markdown:"./contentEditors/markdownEditor",html:"./contentEditors/htmlEditor"},a=$(window);return r});
define('modules/draft/viewmodels/editor/editorModel',["ko","infrastructure/treeViewModel"],function(e,t){function n(n,r,i,a){var o=new t.TreeNodeViewModel(i,a);return o.entity(n),o.language=r.Language(),o.resource=r,o.nodeType="file",o.fallbackResource=e.computed(function(){return n.getResource("de")}),o.embedSrc=e.computed(function(){return o.resource&&o.resource.FileVersion()?"caps://content-file/"+escape(o.resource.FileVersion().File().FileName()):""}),o.showGroup=e.observable(!1),o.selectGroup=function(){o.showGroup(!0)},o.cancelSelectGroup=function(){o.showGroup(!1)},o.groupNameChanged=function(){i.refresh()},o}function r(t,n,r){function i(){if(n.entity()){var e=n.entity().template(),r=e.findCell(t.Name());if(r)return r.title}return a.contentPart?a.contentPart.Name():""}var a=this;r=r||i(),a.contentPart=t,a.title=e.observable(r),a.edit=function(){n.showContentPartEditor(t)}}return n.prototype=new t.TreeNodeViewModel,{DraftFileNode:n,ContentPartViewModel:r}});
define('modules/draft/viewmodels/editor/draftFiles',["durandal/app","../../module","ko","./editorModel","infrastructure/treeViewModel","infrastructure/serverUtil","infrastructure/keyboardHandler"],function(e,t,n,r,i,a,o){function s(s){function c(){var e=s.entity().distinctFileGroupNames();y(n.utils.arrayMap(e,v))}function u(){function e(e){return n.utils.arrayFirst(y(),function(t){return t.name().toLowerCase()===e.toLowerCase()})?!0:!1}var t=s.entity().distinctFileGroupNames(),r=n.utils.arrayFilter(t,function(t){return!e(t)}),i=m();n.utils.arrayForEach(r,function(e){y.push(v(e))});var a=b.tree();!i&&a&&(a.selectRootNode(),a.expandRootNodes())}function d(){var e=new i.TreeViewModel,t=s.entity();e.keyName("Id"),e.createNode=function(){var t=new i.TreeNodeViewModel(e);return t.templateName=n.observable(),t},e.refresh=function(){var r;b.tree()&&(r=b.tree().saveState()),e.clear(),n.utils.arrayForEach(b.sortedFileGroups(),function(r){var i=f(e,r);e.root.addChildNode(i);var a=t.filesByGroupName(r.name());n.utils.arrayForEach(a,function(t){var n=p(e,t);n&&i.addChildNode(n)})}),r&&b.tree()&&b.tree().restoreState(r)},e.on("tree:nodeMoved",function(){g()}),b.tree(e)}function f(e,t){var r=e.createNode();return r.title=n.observable(t.name()),r.nodeType="group",r.entity(t),r.templateName=n.computed(function(){return r.title().length?"draftfilegroup-label":"draftfilegroup-label-empty"}),r.groupName=n.computed({read:function(){return r.entity().name()},write:function(n){n!==t.name()&&(r.entity().name(n),r.childNodes().forEach(function(e){e.entity().Group(n)}),e.refresh())}}),r}function p(e,t){if(!t)return null;var i=new r.DraftFileNode(t,t.getOrCreateResource("de"),e);return i.title=t.Name(),i.templateName=n.observable("draftfile-label"),i}function h(){var e=m();return e?e.title():""}function m(){if(!b.tree()||!b.tree().selectedNode())return null;var e=b.tree().selectedNode();return"group"===e.nodeType?e:e.parentNode()}function v(e){var t={name:n.observable(e)};return t.Id=n.computed(function(){return t.name()}),t}function g(){var e=b.tree(),t=0;e&&n.utils.arrayForEach(e.rootNodes(),function(e){n.utils.arrayForEach(e.childNodes(),function(e){var n=e.entity(),r=t++;n.Ranking()!==r&&n.Ranking(r)})})}var b=this,y=n.observableArray(),w=new o(t);b.name="DraftFiles",b.editor=s,b.server=a,b.determinations=n.observableArray(l),b.tree=n.observable(),b.deactivate=function(){w.deactivate()},s.currentContent.subscribe(function(e){e===b?w.activate():w.deactivate()});var k=!0;b.editor.entity().Files.subscribe(function(){k&&(u(),b.tree().refresh())}),b.groupNames=n.computed(function(){return n.utils.arrayMap(y(),function(e){return e.name()})}),b.sortedFileGroups=n.computed(function(){var e=y();return e.sort(function(e,t){var n=s.entity().rankingByGroupName(e.name()),r=s.entity().rankingByGroupName(t.name());return n===r?0:r>n?-1:1}),e}),b.selectFiles=function(){e.selectFiles({module:t,title:"Anhänge hinzufügen"}).then(function(e){if(e.dialogResult){var t=h(),r=s.entity().rankingByGroupName(t);n.utils.arrayForEach(e.selectedFiles,function(e){s.createDraftFile(e,t,r++)}),g()}})},b.addGroup=function(){function e(e){var t=n.utils.arrayFilter(b.groupNames(),function(t){var n=new RegExp("^("+e+")(\\s+\\(\\d+\\))?.*$","gi");return n.test(t)});return t.length?e+" ("+t.length+")":e}var t=e("Neue Gruppe");y.push(v(t)),b.tree().refresh();var r=b.tree().findNodeByKey(t);r&&(r.selectNode(),r.isExpanded(!0))},b.moveSelectedNodeUp=function(){var e=b.tree().selectedNode();e.moveUp&&e.moveUp()},b.moveSelectedNodeDown=function(){var e=b.tree().selectedNode();e.moveDown&&e.moveDown()},b.removeFile=function(t){var n="Entfernen",r="Abbrechen";e.showMessage("Soll der Anhang "+t.entity().Name()+" wirklich entfernt werden?","Anhang entfernen",[n,r]).then(function(e){e===n&&(t.detachFromParentNode(),t.entity().setDeleted())})},b.deleteGroup=function(){function t(){y.remove(r.entity()),r.detachFromParentNode(),k=!1,n.utils.arrayForEach(i,function(e){e.setDeleted()}),k=!0}var r=m();if(r){var i=n.utils.arrayMap(r.childNodes(),function(e){return e.entity()});if(i.length>0){var a="Gruppe löschen",o="Abbrechen";e.showMessage('Soll die Gruppe "'+r.title()+'" wirklich gelöscht werden?',"Gruppe löschen",[a,o]).then(function(e){e===a&&t()})}else t()}},b.contentTemplateName=function(){if(!b.tree()||!b.tree().selectedNode())return"";var e=b.tree().selectedNode();return"group"==e.nodeType?"draftfiles-group-template":"draftfiles-file-template"},b.navigateToFile=function(){if(b.tree()&&b.tree().selectedNode()&&"file"===b.tree().selectedNode().nodeType){var t=b.tree().selectedNode(),n=t.resource.FileVersion().File();e.trigger("caps:contentfile:navigateToFile",n)}},c(),d(),b.tree()&&(b.tree().refresh(),b.tree().expandRootNodes(),b.tree().selectRootNode()),w.keydown=function(e){var t=document.activeElement;b.tree()&&(!t||"INPUT"!=t.tagName&&"TEXTAREA"!=t.tagName)&&b.tree().handleKeyDown(e)}}var l=[{name:"Picture",title:"Bild"},{name:"Download",title:"Download"},{name:"Misc",title:"Sonstiges"}];return s});
define('modules/draft/viewmodels/editor/draftNotes',["ko"],function(){function e(e){var t=this;t.name="DraftNotes",t.editor=e}return e});
define('modules/draft/viewmodels/editor/draftProperties',["require","moment"],function(e,t){function n(e){var n=this;n.name="DraftProperties",n.editor=e,n.createdBy=ko.computed(function(){return e.entity().Created().By()}),n.createdAt=ko.computed(function(){return t(e.entity().Created().At()).format("LLLL")}),n.createdFromNow=ko.computed(function(){return t(e.entity().Created().At()).fromNow()}),n.modifiedBy=ko.computed(function(){return e.entity().Modified().By()}),n.modifiedAt=ko.computed(function(){return t(e.entity().Modified().At()).format("LLLL")}),n.modifiedFromNow=ko.computed(function(){return t(e.entity().Modified().At()).fromNow()})}return n});
define('modules/draft/viewmodels/editor/draftTemplate',["../../contentGenerator"],function(e){function t(t){var n=this;this.name="DraftTemplate",this.editor=t,this.showPreview=ko.observable(!1),n.editContentPart=function(e){var t=n.editor.getOrCreateContentPart(e);t&&n.editor.showContentPartEditor(t)},n.previewText=function(e){if(!e||!e.name)return"";var t=n.editor.entity().findContentPart(e.name);return t?t.previewText("de",120):void 0},n.prepareCellContent=function(t){if(!t||!t.name)return"";var r=n.editor.entity().findContentPart(t.name);return r?e.createTemplateCellContent(n.editor.entity(),t,"de"):""},n.togglePreview=function(){n.showPreview(!n.showPreview())}}return t});
define('modules/draft/viewmodels/editor/navigation',["require","ko","./editorModel"],function(e,t,n){function r(e){var r=this;this.title="Navigation",this.editor=e,this.currentView=t.computed(function(){return r.editor.currentContent()?r.editor.currentContent().name:void 0}),this.contentParts=t.computed(function(){function e(e,t){return e.templateCellIndex()===t.templateCellIndex()||e.templateCellIndex()<t.templateCellIndex()?-1:1}if(r.editor.entity()){var i=r.editor.entity().ContentParts();return i.sort(e),t.utils.arrayMap(i,function(e){return new n.ContentPartViewModel(e,r.editor)})}return[]}),this.title=t.computed(function(){var t="Unbenannt",n=e.entity();return n&&n.Name&&(n.Name().length?t=n.Name():"Added"===n.entityAspect.entityState.name&&(t="Neuer Entwurf")),t}),this.numberOfFiles=t.computed(function(){return r.editor.entity()?r.editor.entity().Files().length:0})}return r});
define('modules/draft/viewmodels/editor/templateEditor',["ko"],function(e){function t(t){function n(){if(t.entity()){var e=t.entity().template(),n=JSON.stringify(e,null,4);r.templateContent(n)}}var r=this;r.name="TemplateEditor",r.editor=t,r.templateContent=e.observable(),t.entity()&&n(),r.templateContent.subscribe(function(){var e;try{e=JSON.parse(r.templateContent())}catch(t){return alert("Die Vorlage konnte nicht verarbeitet werden."),void 0}r.editor.entity().Template(JSON.stringify(e))}),t.entity.subscribe(n)}return t});
define('modules/draft/viewmodels/editor/editor',["durandal/app","durandal/system","../../module","../../datacontext","../../entities","entityManagerProvider","breeze","ko","Q","./navigation","./draftTemplate","./draftProperties","./draftFiles","./contentPartEditor","./templateEditor","./draftNotes","./editorModel","authentication"],function(e,t,n,r,i,a,o,s,l,c,u,d,f,p,h,m,v,g){function b(){function l(e){var t=e.Id(),n=s.utils.arrayFilter(M.entity().Files(),function(e){var n=s.utils.arrayFirst(e.Resources(),function(e){return e.FileVersion()&&e.FileVersion().FileId()===t});return null!=n});if(n.length){var r=o.EntityQuery.from("Files").where("Id","==",t).expand("Versions.File");return T.executeQuery(r)}}function v(e,t,n){n=n||"de",r.getTemplate(e).then(function(r){var i=r,a=T.createEntity("Draft",{TemplateName:e,Version:1,OriginalLanguage:n,Status:"NEW"});a.Template(JSON.stringify(i)),a.Created().At(new Date),a.Created().By(g.user().userName()),a.Modified().At(new Date),a.Modified().By(g.user().userName()),t&&t.name&&a.Name(t.name),M.entity(a),i.forEachCell(function(e,n,r){var i=M.getOrCreateContentPart(n);if(i.Ranking(r),n.content){var a=/<%\s*([A-Za-z0-9_\.]+)\s*%>/gi,o=n.content.replace(a,function(e,n){return t&&t[n]?t[n]:b(n)||"Nicht gefunden"});i.getResource("de").Content(o)}})})}function b(e){if(!M.entity()||!M.entity().template())return null;var t=M.entity().template();if(!t.parameters)return null;var n=s.utils.arrayFirst(t.parameters,function(t){return t.name.toLowerCase()===e.toLowerCase()});return n?n.value:null}function y(e){var t=o.EntityQuery.from("Drafts").where("Id","==",e).expand("ContentParts.Resources, Files.Resources.FileVersion.File");return T.executeQuery(t).then(function(e){M.entity(e.results[0])})}function w(){M.entity().setDeleted(),T.saveChanges().then(function(){e.trigger("caps:draft:deleted",M.entity()),M.navigateBack()})}function k(){C=C||new c(M);var e=P.activeInstruction().queryParams;if(e&&e.t)if("DraftProperties"===e.t)M.showProperties();else if("DraftFiles"===e.t)M.showFiles();else{var t=M.entity().findContentPart(e.t);t&&M.showContentPartEditor(t)}M.currentContent()||(N=N||new u(M),M.currentContent(N)),M.currentNavigation(C)}function x(e){var t=s.utils.arrayFirst(E,function(t){return t.contentPart===e});return t||(t=new p(M,e),E.push(t)),t}var C,N,D,F,S,I,M=this,T=a.createManager(),E=[],P=n.router,_=s.observable();M.currentContent=s.observable(),M.currentNavigation=s.observable(),M.entity=s.observable(),M.template=s.computed(function(){return M.entity()?M.entity().template():void 0}),M.isNewDraft=s.observable(!1),M.draftStates=i.supportedDraftStates,M.lastContentPart=s.observable(),T.hasChangesChanged.subscribe(function(e){n.routeConfig.hasUnsavedChanges(e.hasChanges)}),T.validationErrorsChanged.subscribe(function(e){var t=e.entity;_(t.hasValidationErrors.call(t))}),M.activate=function(n,r){return e.on("caps:contentfile:replaced",l),t.defer(function(e){n&&/^[0-9]+$/.test(n)?y(n).then(function(){k(),e.resolve()}):(M.isNewDraft(!0),v(n,r),k(),e.resolve())}).promise()},M.canDeactivate=function(){return T.hasChanges()?t.defer(function(t){var n="Speichern",r="Verwerfen",i="Abbrechen";e.showMessage("Sollen die Änderungen gespeichert werden?","Änderungen speichern?",[n,r,i]).then(function(e){if(e===i)t.resolve(!1);else if(e===n){var r=M.saveChanges();r&&r.then?r.then(function(){t.resolve(!0)}):t.resolve(!1)}else t.resolve(!0)})}).promise():!0},M.deactivate=function(){n.routeConfig.hasUnsavedChanges(!1),e.off("caps:contentfile:replaced",l),D&&D.deactivate()},M.shouldActivate=function(e,t,n){return t[0]!==n[0]},M.showEditorMain=function(){N=N||new u(M),M.currentContent(N),M.lastContentPart(null)},M.showLayoutArea=function(){M.lastContentPart()?M.showContentPartEditor(M.lastContentPart()):M.showEditorMain()},M.showFiles=function(){D=D||new f(M),M.currentContent(D)},M.showProperties=function(){F=F||new d(M),M.currentContent(F)},M.showContentPartEditor=function(e){var t=x(e);t&&(t.showPreview(!1),M.currentContent(t),M.lastContentPart(e))},M.showTemplateEditor=function(){S=S||new h(M),M.currentContent(S)},M.showDraftNotes=function(){I=I||new m(M),M.currentContent(I)},M.navigateBack=function(){M.showDraftsIndex()},M.showDraftsIndex=function(){n.router.navigate(n.routeConfig.hash)},M.saveChangesAndNavigateBack=function(){M.saveChanges().then(M.navigateBack)},M.saveChanges=function(){if(_())return e.showMessage("Der Inhalt kann noch nicht gespeichert werden. Prüfe die markierten Felder und ergänze oder korrigiere die Eingaben.","Noch nicht komplett",["Ok"]),!1;M.entity().Modified().At(new Date),M.entity().Modified().By(g.user().userName());var t=T.getEntities("DraftFile",o.EntityState.Deleted);return T.saveChanges().then(function(){e.trigger("caps:draft:saved",{entity:M.entity(),isNewDraft:M.isNewDraft(),deletedFiles:t}),n.routeConfig.hasUnsavedChanges(!1)})},M.deleteDraft=function(){var t="Entwurf löschen",n="Abbrechen";e.showMessage("Soll der Entwurf wirklich gelöscht werden?","Entwurf löschen",[t,n]).then(function(e){if(e===t){if(M.isNewDraft())return T.rejectChanges(),M.navigateBack(),void 0;w()}})},M.getOrCreateContentPart=function(e){var t=M.entity().findContentPart(e.name);if(!t){t=T.createEntity("DraftContentPart",{DraftId:M.entity().Id(),Name:e.name,ContentType:e.contentType||"markdown"}),T.addEntity(t);var n=T.createEntity("DraftContentPartResource",{DraftContentPartId:M.entity().Id(),Language:"de",Content:""});T.addEntity(n),t.Resources.push(n),M.entity().ContentParts.push(t)}return t},M.createDraftFile=function(e,t,n){var r=o.EntityQuery.from("Files").where("Id","==",e.Id()).expand("Versions.File");return T.executeQuery(r).then(function(r){var i=r.results[0],a=T.createEntity("DraftFile",{Name:e.FileName()});e.isImage()&&a.Determination("Picture"),t&&t.length&&a.Group(t),T.addEntity(a);var o=T.createEntity("DraftFileResource",{Language:"de",DbFileVersionId:i.latestVersion().Id()});return T.addEntity(o),a.Resources.push(o),a.DraftId(M.entity().Id()),a.Ranking(n),M.entity().Files.push(a),a})}}return $(window),b});
define('modules/draft/viewmodels/index',["../module","../datacontext","ko","durandal/app","moment","localization","infrastructure/publicationService","../contentGenerator","infrastructure/listSortModel","../commands/deleteDraft","./draftSearchControl","infrastructure/interaction","infrastructure/keyCode","durandal/composition","infrastructure/keyboardHandler","infrastructure/scrollState","./draftPublicationDialog","./draftPublicationViewModel"],function(e,t,n,r,i,a,o,s,l,u,c,d,f,p,h,m,v,g){function b(e){if(e&&F()){var t=e.Content();t&&t.EntityKey()==F().draftId()&&k(F().draftId(),S())}}function y(){var e=P;return M(!0),t.searchDrafts(e.searchWords(),e.sortOptions.getOrderBy()).then(function(e){var t=n.utils.arrayMap(e.results,function(e){return new N(e)});D(t),M(!1)})}function w(e){return t.getDraft(e).then(function(t){var n=t.results[0],r=s.createTemplateContent(t.results[0],"de"),i=new C(n,r);S(i),k(e,S())})}function k(e,r){t.fetchPublications(e).then(function(e){r.publications(n.utils.arrayMap(e,function(e){return new g(r.entity(),e)}))}).fail(function(e){alert(e.message)})}function x(){D().length&&A.selectDraft(D()[0])}function C(t,r){var o=this,s=new a.Language(t.OriginalLanguage());o.entity=n.observable(t),o.template=n.observable(r),o.originalLanguage=s,o.supportedTranslations=a.website.supportedTranslations(s.culture),o.publications=n.observableArray(),o.createdAt=n.computed(function(){return i(t.Created().At()).format("LLLL")}),o.createdFromNow=n.computed(function(){return i(t.Created().At()).fromNow()}),o.modifiedAt=n.computed(function(){return i(t.Modified().At()).format("LLLL")}),o.modifiedFromNow=n.computed(function(){return i(t.Modified().At()).fromNow()}),o.translateDraft=function(n){e.router.navigate("#drafts/translate/"+t.Id()+"/"+n.culture)}}function N(e){var t=this;t.draftId=n.computed(function(){return e.Id()}),t.createdAt=n.computed(function(){return t.formatDate(e.Created().At())}),t.modifiedAt=n.computed(function(){return t.formatDate(e.Modified().At())}),t.title=n.computed(function(){return e.Name()}),t.isSelected=n.computed(function(){return F()&&F().draftId()===t.draftId()}),t.status=n.computed(function(){return e.statusTitle()}),t.scrollIntoViewRequest=new d.InteractionRequest("ScrollIntoView")}var D=n.observableArray(),F=n.observable(),S=n.observable(),I=!1,M=n.observable(!1),T=new u,P=new c,E=new h(e),_=new m(e);P.refreshResults=function(){A.refresh()},r.on("caps:draft:saved",function(e){e.deletedFiles&&e.deletedFiles.length&&e.deletedFiles.forEach(function(e){t.detachDraftFile(e)});var n=e.entity;F()&&F().draftId()===n.Id()&&w(F().draftId()),e.isNewDraft?y().then(function(){A.selectDraftById(n.Id())}):A.selectDraftById(n.Id())}),r.on("caps:draft:deleted",function(){y().then(x)}),r.on("caps:publication:created",b),r.on("caps:publication:refreshed",b);var R=$(window);e.on("module:compositionComplete",function(e,t){t===A&&(R.trigger("forceViewportHeight:refresh"),_.activate())});var A={items:D,selectedItem:F,draftPreview:S,isLoading:M,searchControl:P,draftListScrollState:_,activate:function(){I||(I=!0,y().then(function(){x()})),E.activate()},deactivate:function(){E.deactivate(),_.deactivate()},addDraft:function(){e.router.navigate("#drafts/create")},editDraft:function(t){e.router.navigate("#drafts/edit/"+t.draftId())},editSelectedDraft:function(){A.editDraft(F())},selectDraft:function(e){F(e),e&&e.scrollIntoView(),S(null),w(e.draftId())},selectDraftById:function(e){var t=n.utils.arrayFirst(D(),function(t){return t.draftId()===e});t&&A.selectDraft(t)},selectNextDraft:function(){if(F()){var e=D().indexOf(F());e<D().length-1&&A.selectDraft(D()[e+1])}else A.selectDraft(D()[0])},selectPreviousDraft:function(){if(F()){var e=D().indexOf(F());e>0&&A.selectDraft(D()[e-1])}else A.selectDraft(D()[D().length-1])},publishDraft:function(){var t=new v(S().entity());e.showDialog(t).then(function(){})},refresh:function(){y()},deleteDraft:function(){T.execute(F().draftId())}};return E.keydown=function(e){var t=e.keyCode;(t===f.keys.UP||t===f.keys.DOWN)&&(e.preventDefault(),t===f.keys.UP&&A.selectPreviousDraft(),t===f.keys.DOWN&&A.selectNextDraft())},N.prototype.scrollIntoView=function(){this.scrollIntoViewRequest.trigger()},N.prototype.formatDate=function(e){return i(e).calendar()},A});
define('modules/draft/viewmodels/templateGallery',["ko","../datacontext","../module","breeze","entityManagerProvider","durandal/system","infrastructure/serverUtil"],function(e,t,n,r,i,a,o){function s(t,n,r,i){var a=this;a.title=t,a.name=n,a.template=r,a.icon=i,a.isSelected=e.computed(function(){return f()===a})}function l(){return a.defer(function(t){u().then(function(n){var r=e.utils.arrayMap(n,function(e){var t=c(e.TemplateContent());return new s(e.Name(),e.Name(),t,o.mapPath("~/App/modules/draft/images/Template 3.png"))}),i=r;d(i),t.resolve()}).fail(t.reject)})}function u(){var e=(new p).from("Websites").expand("DraftTemplates");return h.executeQuery(e).then(function(e){return e.results[0].DraftTemplates()})}function c(e){var t;try{t=JSON.parse(e)}catch(n){a.log(n.message)}return t}var d=e.observableArray(),f=e.observable(),p=r.EntityQuery,h=i.createManager(),m=e.observable();return{activate:function(){m(""),f(null),l()},listItems:d,selectedItem:f,draftName:m,selectTemplate:function(e){f(e)},createDraft:function(){if(f()){var e="#drafts/create/"+f().name,t=[];m()&&t.push("name="+encodeURIComponent(m()));var r=f().template;r.parameters&&r.parameters.forEach(function(e){e.value&&t.push(e.name+"="+encodeURIComponent(e.value))}),t.length&&(e+="?"+t.join("&")),n.router.navigate(e)}},cancel:function(){n.router.navigate("#drafts")}}});
define('modules/draft/viewmodels/translator/contentPartEditor',["ko"],function(){function e(e,n,r){this.name="ContentPartEditor",this.editor=e,this.contentPart=n,this.resource=n.getOrCreateResource(r,e.manager),this.title=n.Name(),this.originalContent=t(n.getResource("de").Content()).replace(/\n/g,"<br />")}function t(e){return String(e).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}return e});
define('modules/draft/viewmodels/translator/draftFiles',["durandal/app","../../module","ko"],function(){function e(e){var t=this;t.name="DraftFiles",t.editor=e}return e});
define('modules/draft/viewmodels/translator/draftProperties',["require","moment","ko"],function(e,t){function n(e){var n=this;n.name="DraftProperties",n.editor=e,n.moment=t,n.translation=e.entity().getTranslation(e.language().culture)}return n});
define('modules/draft/viewmodels/translator/navigation',["require","ko"],function(e,t){function n(e){function n(){var n=[];if(i.entity()){var a=i.entity().template();t.utils.arrayForEach(a.rows,function(a){t.utils.arrayForEach(a.cells,function(t){var a=i.entity().findContentPart(t.name);a&&n.push(new r(a,t,e))})})}i.contentParts(n)}var i=this;i.title="Navigation",i.editor=e,i.contentParts=t.observableArray(),i.currentView=t.computed(function(){return i.editor.currentContent()?i.editor.currentContent().name:void 0}),i.currentContentPart=t.computed(function(){return i.editor.currentContent()&&"ContentPartEditor"===i.editor.currentContent().name?i.editor.currentContent().contentPart.Name():void 0}),i.entity=t.computed(function(){return i.editor.entity()}),i.entity()&&n(),i.entity.subscribe(n),i.numberOfFiles=t.computed(function(){var e=i.entity();return e?e.Files().length:0})}function r(e,t,n){var r=this;r.contentPart=e,r.templateCell=t,r.editor=n,r.editContentPart=function(){n.showContentPartEditor(e)}}return n});
define('modules/draft/viewmodels/translator/translator',["durandal/app","../../module","ko","entityManagerProvider","breeze","Q","./navigation","./contentPartEditor","./draftFiles","./draftProperties","../editor/editorModel","localization"],function(e,t,n,r,i,a,o,s,l,u,c,d){function f(){function c(){h.trigger("forceViewportHeight:refresh")}function f(e){var t=i.EntityQuery.from("Drafts").where("Id","==",e).expand("Translations, ContentParts.Resources, Files.Resources.FileVersion.File");return x.executeQuery(t).then(function(e){k.entity(e.results[0])})}function m(){if(b=b||new o(k),k.currentNavigation(b),b.contentParts().length){var e=b.contentParts()[0],t=v(e.contentPart);t&&k.currentContent(t)}}function v(e){var t=n.utils.arrayFirst(C,function(t){return t.contentPart===e});return t||(t=new s(k,e,k.language().culture),C.push(t)),t}function g(e){if(e){var t=n.utils.arrayMap(e.Files(),function(e){var t=e.getResource("de"),n=e.getOrCreateResource(k.language().culture,x);return new p(k,e,t,n)});k.files(t),e.getOrCreateTranslation(k.language().culture,x)}}var b,y,w,k=this,x=r.createManager(),C=[];k.manager=x,k.draftId=n.observable(),k.language=n.observable(),k.currentContent=n.observable(),k.currentNavigation=n.observable(),k.entity=n.observable(),k.entity.subscribe(g),k.files=n.observableArray(),k.activate=function(e,n){t.on("module:compositionComplete",c),k.draftId(e),k.language(new d.Language(n));var r=a.defer();return f(e).then(function(){m(),r.resolve()}),r.promise},k.deactivate=function(){t.off("module:compositionComplete",c)},k.navigateBack=function(){k.showDraftsIndex()},k.showDraftsIndex=function(){t.routeConfig.hasUnsavedChanges(!1),t.router.navigate(t.routeConfig.hash)},k.showFiles=function(){y=y||new l(k),k.currentContent(y)},k.showProperties=function(){w=w||new u(k),k.currentContent(w)},k.saveChanges=function(){k.entity().Modified().At(new Date),k.entity().Modified().By("me"),x.saveChanges().then(function(){e.trigger("caps:draft:saved",{entity:k.entity(),isNewDraft:!1}),k.showDraftsIndex()})},k.showContentPartEditor=function(e){var t=v(e);t&&k.currentContent(t)},k.fetchFile=function(e){var t=i.EntityQuery.from("Files").where("Id","==",e).expand("Versions");return x.executeQuery(t)}}function p(r,i,a,o){function s(e){r.fetchFile(e.Id()).then(function(e){var t=e.results[0].latestVersion();l.translation.DbFileVersionId(t.Id())})}var l=this;l.draftFile=i,l.original=a,l.translation=o,l.FileVersion=n.computed(function(){return l.translation&&l.translation.FileVersion()?l.translation.FileVersion():l.original.FileVersion()}),l.selectFile=function(){e.selectFiles({module:t,title:"Übersetzung für "+a.FileVersion().File().FileName()+" wählen"}).then(function(e){if(e.dialogResult&&e.selectedFiles.length>0){var t=e.selectedFiles[0];s(t)}})},l.resetFile=function(){l.translation.DbFileVersionId(null)}}var h=$(window);return f});
define('text!modules/draft/views/draftPublicationDialog.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n    <div class="panel-padding-h">\r\n        <div class="row">\r\n            <div class="col-md-12">\r\n                <h3>Inhalt <em data-bind="text: draft().Name"></em> <em>(<!-- ko text: \'v.\' + draft().Version() --><!-- /ko -->)</em> veröffentlichen</h3>\r\n            </div>\r\n        </div>\r\n\r\n        <div class="row">\r\n            <div class="col-md-4">\r\n                <div class="panel-padding-v">\r\n                    <h4>Neue Veröffentlichung</h4>\r\n                    <!-- ko compose: siteMapTree --><!-- /ko -->\r\n                </div>\r\n            </div>\r\n            <div class="col-md-8">\r\n                <div class="panel-padding-v">\r\n                    <!-- ko if: publications().length > 0 -->\r\n                    <h4>Vorhandene Veröffentlichungen (<!-- ko text: publications().length --><!-- /ko -->)</h4>\r\n                    <div class="space-tb">\r\n                        <ul data-bind="foreach: publications()" class="list-unstyled">\r\n                            <li>\r\n                                <i class="fa fa-share-square-o"></i> <span data-bind="text: title" />\r\n                                (<em data-bind="text: modifiedBy"></em> <em data-bind="text: modifiedAt"></em>, <em data-bind="text: contentVersion"></em>)\r\n                                <!-- ko if: isOutdated -->\r\n                                &nbsp;<a href="#" data-bind="click: republish"><i class="fa fa-refresh"></i> Aktualisieren</a>\r\n                                <!-- /ko -->\r\n                            </li>\r\n                        </ul>\r\n                    </div>\r\n                    <!-- ko if: hasOutdatedPublications -->\r\n                    <div class="space-tb">\r\n                        <a href="#" class="btn btn-default"><i class="fa fa-refresh"></i> Alle aktualisieren</a>\r\n                    </div>\r\n                    <!-- /ko -->\r\n                    <!-- /ko -->\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: selectCancel"><span><i class="fa fa-arrow-left fa-fw"></i> Zurück</span></a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: selectOk"><span><i class="fa fa-save fa-fw"></i> Neue Veröffentlichung erstellen</span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/draftSearchControl.html',[],function () { return '<div class="form-group draft-search">\r\n    <div class="input-group">\r\n        <input type="text" class="form-control" placeholder="Inhalte durchsuchen..." data-bind="delayedSearch: { searchObservable: searchWords, searchHandler: search }" />\r\n        <div class="input-group-btn">\r\n            <button role="button" data-bind="click: sortOptions.toggleSortDirection" class="btn btn-default">\r\n                <span><i data-bind="css: { \'fa-sort-alpha-asc\': sortOptions.sortDirection() == \'asc\', \'fa-sort-alpha-desc\': sortOptions.sortDirection() != \'asc\' }" class="fa fa-fw"></i></span>\r\n            </button>\r\n            <button id="dLabel" role="button" data-toggle="dropdown" data-target="#" class="btn btn-default dropdown-toggle"><b class="caret" /></button>\r\n            <ul class="dropdown-menu pull-right" role="menu" aria-labelledby="dLabel">\r\n                <!-- ko foreach: sortOptions.columns -->\r\n                <li role="presentation">\r\n                    <a role="menuitem" tabindex="-1" href="#" data-bind="click: sort">\r\n                        <span class="pull-right" data-bind="visible: isSelected"><i class="fa fa-check"></i></span>\r\n                        <span data-bind="text: title" class="mnu-label"></span>\r\n                    </a>\r\n                </li>\r\n                <!-- /ko -->\r\n                <li role="presentation" class="divider"></li>\r\n                <li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-bind="click: sortOptions.sortAsc"><span class="pull-right" data-bind="visible: sortOptions.sortDirection() == \'asc\'"><i class="fa fa-check"></i></span> Aufsteigend</a></li>\r\n                <li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-bind="click: sortOptions.sortDesc"><span class="pull-right" data-bind="visible: sortOptions.sortDirection() == \'desc\'"><i class="fa fa-check"></i></span> Absteigend</a></li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/draftSelectionDialog.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n    <div class="panel-padding-h">\r\n\r\n        <div class="toolbar row">\r\n            <div class="col-md-6 col-lg-8">\r\n                <h3>Inhalt wählen</h3>\r\n            </div>\r\n            <div class="col-md-6 col-lg-4">\r\n                <!-- ko compose: { model: searchControl } --><!-- /ko -->\r\n            </div>\r\n        </div>\r\n\r\n        <div class="row">\r\n            <div class="col-md-12">\r\n                <div class="panel-padding-v">\r\n                    <table class="table table-striped table-list">\r\n                        <thead>\r\n                            <tr>\r\n                                <th class="td-4">Name</th>\r\n                                <th class="td-3">Letzte Änderung</th>\r\n                                <th class="td-15">Erstellt am</th>\r\n                                <th class="td-15">Autor</th>\r\n                            </tr>\r\n                        </thead>\r\n                        <tbody data-bind="foreach: listItems">\r\n                            <tr data-bind="css: { \'selected\': isSelected }, click: selectItem">\r\n                                <td><i class="fa fa-file-text"></i> <strong data-bind="text: entity.Name"></strong></td>\r\n                                <td><span data-bind="text: modifiedAt() + \' von \' + entity.Modified().By() + \' (v.\' + entity.Version() + \')\'"></span></td>\r\n                                <td><span data-bind="text: createdAt"></span></td>\r\n                                <td><span data-bind="text: entity.Created().By"></span></td>\r\n                            </tr>\r\n                        </tbody>\r\n                    </table>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: selectCancel"><span><i class="fa fa-arrow-left fa-fw"></i> Abbrechen</span></a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: selectOk"><span><i class="fa fa-save fa-fw"></i> <!-- ko text: okTitle --><!-- /ko --></span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/editor/contentEditors/htmlEditor.html',[],function () { return '\r\n<div class="content-editor container-toolbar-top">\r\n    <div class="content-toolbar">\r\n        <div class="btn-group">\r\n            <a class="btn btn-default" href="#"><i class="fa fa-bold"></i></a>\r\n        </div>\r\n    </div>\r\n    <textarea class="form-control" data-bind="value: content"></textarea>\r\n</div>';});

define('text!modules/draft/views/editor/contentEditors/insertImageDialog.html',[],function () { return '<div class="messageBox dialog-large">\r\n    <div class="modal-header">\r\n        <h4>Bild einfügen</h4>\r\n    </div>\r\n    <div class="modal-body">\r\n        <div class="row panel-scroll-v">\r\n            <ul data-bind="foreach: files" class="list-inline">\r\n                <li data-bind="click: $parent.selectFile, css: { \'item-selected\': isSelected() }">\r\n                    <a class="thumbnail" data-bind="if: resource.FileVersion()">\r\n                        <!-- ko template: { name: \'insertImageDlg-dbfile-icon\' } --><!-- /ko -->\r\n                    </a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n\r\n        <div class="row modal-section">\r\n            <div class="form-group">\r\n                <div class="col-md-12">\r\n                    <label class="control-label">Adresse</label>\r\n                    <input type="text" class="form-control" data-bind="value: imageUrl" />\r\n                </div>\r\n            </div>\r\n        </div>\r\n\r\n        <form class="form-inline" style="margin-top:15px;">\r\n            <div class="form-group">\r\n                <label class="checkbox-inline">\r\n                    <input type="checkbox" data-bind="checked: thumbnail" /> Bild verkleinern\r\n                </label>\r\n            </div>\r\n            <div class="pull-right">\r\n                <div class="form-group">\r\n                    <label class="control-label" data-bind="uniqueFor: { value: thumbnailWidth, prefix: \'iidlg-thumbwidth\' }">Breite: </label>\r\n                    <input type="text" data-bind="value: thumbnailWidth, uniqueId: { value: thumbnailWidth, prefix: \'iidlg-thumbwidth\' }" class="form-control" style="width:80px" />\r\n                </div>\r\n                <div class="form-group">\r\n                    <label class="control-label" data-bind="uniqueFor: { value: thumbnailHeight, prefix: \'iidlg-thumbheight\' }">Höhe: </label>\r\n                    <input type="text" data-bind="value: thumbnailHeight, uniqueId: { value: thumbnailHeight, prefix: \'iidlg-thumbheight\' }" class="form-control" style="width:80px" />\r\n                </div>\r\n            </div>\r\n        </form>\r\n    </div>\r\n    <div class="modal-footer">\r\n        <div class="pull-left">\r\n            <a href="#" class="btn btn-link" data-bind="click: addFiles"><i class="fa fa-plus"></i> Bilder hinzufügen</a>\r\n        </div>\r\n        <button class="btn btn-primary" data-bind="click: ok">Ok</button>\r\n        <button class="btn btn-default" data-bind="click: cancel">Abbrechen</button>\r\n    </div>\r\n</div>\r\n\r\n<script type="text/html" id="insertImageDlg-dbfile-icon">\r\n    <!-- ko with: resource.FileVersion() -->\r\n    <!-- ko if: File().isImage && File().isImage() -->\r\n    <img data-bind="attr: { \'src\': \'/DbFileContent/Thumbnail/\' + Id() + \'?thumbnailName=110x80&h=\' + Hash(), title: File().FileName, alt: File().FileName }" />\r\n    <!-- /ko -->\r\n    <!-- ko if: File().isImage && !File().isImage() -->\r\n    <span data-bind="attr: { title: File().FileName }"><i class="fa fa-file fa-4x"></i></span>\r\n    <!-- /ko -->\r\n    <!-- /ko -->\r\n</script>';});

define('text!modules/draft/views/editor/contentEditors/insertLinkDialog.html',[],function () { return '<div class="messageBox">\r\n    <div class="modal-header">\r\n        <h4>Link einfügen</h4>\r\n    </div>\r\n    <div class="modal-body">\r\n        <p class="message">...</p>\r\n    </div>\r\n    <div class="modal-footer">\r\n        <button class="btn btn-primary" data-bind="click: ok">Ok</button>\r\n        <button class="btn btn-default" data-bind="click: cancel">Abbrechen</button>\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/editor/contentEditors/markdownEditor.html',[],function () { return '\r\n<div class="content-editor container-toolbar-top" data-bind="pagedownEditor: $data">\r\n    <div class="content-toolbar btn-toolbar wmd-toolbar" role="toolbar">\r\n\r\n    </div>\r\n    <textarea class="form-control"></textarea>\r\n    <div class="wmd-preview" style="display:none">\r\n        \r\n    </div>\r\n</div>';});

define('text!modules/draft/views/editor/contentEditors/textEditor.html',[],function () { return '<div class="content-editor">\r\n    <textarea class="form-control" data-bind="value: content" title="Text-Editor"></textarea>\r\n</div>';});

define('text!modules/draft/views/editor/contentPartEditor.html',[],function () { return '<div data-bind="forceViewportHeight: { spacers: \'.contentpart-nav\', minWidth: 992 }, css: { \'panel-scroll-v\': showPreview(), \'contentpart-preview\': showPreview() }">\r\n    <!-- ko if: !showPreview() -->\r\n    <!-- ko compose: contentEditor --><!-- /ko -->\r\n    <!-- /ko -->\r\n\r\n    <!-- ko if: showPreview() -->\r\n    <div data-bind="html: previewContent"></div>\r\n    <!-- /ko -->\r\n</div>\r\n<div class="contentpart-nav">\r\n    <div class="pull-right">\r\n        <strong data-bind="text: title" class="space-right"></strong> \r\n        <a href="#" class="space-right" data-bind="click: togglePreview"><i class="glyphicon glyphicon-eye-open" data-bind="css: { \'glyphicon-eye-open\': !showPreview(), \'glyphicon-eye-close\': showPreview() }"></i></a>\r\n        <select data-bind="options: contentTypes, optionsText: \'title\', optionsValue: \'value\', value: contentPart.ContentType"></select>\r\n    </div>\r\n    <a href="#" data-bind="click: editor.showEditorMain"><i class="fa fa-columns"></i> Layoutübersicht</a>\r\n</div>';});

define('text!modules/draft/views/editor/draftFiles.html',[],function () { return '\r\n<div class="row">\r\n    <div class="col-md-2 left-fixed-sidebar draftfiles-sidebar">\r\n        <div data-bind="if: tree(), forceViewportHeight: { spacers: \'.draftfiles-sidebar > .draftfiles-sidebar-nav\', minWidth: 992 }" class="panel-scroll-vh">\r\n            <!-- ko template: { name: \'draftfile-node-template\', data: tree().rootNodes } --><!-- /ko -->\r\n        </div>\r\n        <div class="draftfiles-sidebar-nav">\r\n            <ul class="list-inline">\r\n                <li><a href="#" data-bind="click: addGroup" title="Neue Gruppe"><i class="fa fa-folder"></i> Neu</a></li>\r\n                <!-- ko if: tree() && tree().selectedNode() -->\r\n                <li><a href="#" title="Nach oben" data-bind="click: moveSelectedNodeUp"><i class="fa fa-arrow-up"></i></a></li>\r\n                <li><a href="#" title="Nach unten" data-bind="click: moveSelectedNodeDown"><i class="fa fa-arrow-down"></i></a></li>\r\n                <!-- /ko -->\r\n            </ul>\r\n        </div>\r\n    </div>\r\n    <div class="col-md-offset-2 col-md-10">\r\n        <!-- ko if: tree().selectedNode() -->\r\n        <!-- ko template: { name: contentTemplateName, data: tree().selectedNode() } --><!-- /ko -->\r\n        <!-- /ko -->\r\n        <!-- ko if: !tree().selectedNode() || contentTemplateName() === \'draftfiles-group-template\' -->\r\n        <div class="bottom-fixed-navbar-l2">\r\n            <ul class="list-inline">\r\n                <li><a href="#" data-bind="click: selectFiles"><span><i class="fa fa-plus"></i> Anhänge hinzufügen</span></a></li>\r\n                <!-- ko if: contentTemplateName() === \'draftfiles-group-template\' -->\r\n                <li><a href="#" data-bind="click: deleteGroup"><span><i class="fa fa-times"></i> Gruppe löschen</span></a></li>\r\n                <!-- /ko -->\r\n            </ul>\r\n        </div>\r\n        <!-- /ko -->\r\n    </div>\r\n</div>\r\n\r\n<script type="text/html" id="draftFiles-dbfile-icon">\r\n    <!-- ko with: resource.FileVersion() -->\r\n    \r\n    <!-- ko if: File().isImage && File().isImage() -->\r\n    <img data-bind="attr: { \'src\': \'DbFileContent/Thumbnail/\' + Id() + \'?thumbnailName=220x160&h=\' + Hash(), alt: File().FileName }" />\r\n    <!-- /ko -->\r\n    <!-- ko if: File().isImage && !File().isImage() -->\r\n    <span data-bind="attr: { title: File().FileName }"><i class="fa fa-file fa-4x"></i></span>\r\n    <!-- /ko -->\r\n\r\n    <!-- /ko -->\r\n</script>\r\n\r\n<script type="text/html" id="draftfile-node-template">\r\n    <ul data-bind="foreach: $data" class="list-unstyled tree-branch">\r\n        <li data-bind="if: !(entity() && entity().entityAspect && entity().entityAspect.entityState.isDeleted())">\r\n            <div class="tree-node" data-bind="css: { \'tree-node-selected\': isSelected }">\r\n                <div class="tree-node-toggle pull-left">\r\n                    <a href="#" data-bind="click: toggleIsExpanded">\r\n                        <i class="fa fa-fw" data-bind="css: { \'fa-plus\': !isExpanded() && hasChildNodes(), \'fa-minus\': isExpanded() && hasChildNodes() }"></i>\r\n                    </a>\r\n                </div>\r\n                <div class="tree-node-label" data-bind="click: selectNode">\r\n                    <!-- ko template: { name: templateName } --><!-- /ko -->\r\n                </div>\r\n            </div>\r\n            <!-- ko if: isExpanded() && hasChildNodes() -->\r\n            <!-- ko template: { name: \'draftfile-node-template\', data: childNodes() } --><!-- /ko -->\r\n            <!-- /ko -->\r\n        </li>\r\n    </ul>\r\n</script>\r\n\r\n<script type="text/html" id="draftfilegroup-label">\r\n    <i class="fa fa-fw" data-bind="css: { \'fa-folder-open-o\': isExpanded(), \'fa-folder-o\': !isExpanded() }"></i>\r\n    <span data-bind="text: entity().name"></span>\r\n</script>\r\n\r\n<script type="text/html" id="draftfilegroup-label-empty">\r\n    <i class="fa fa-fw" data-bind="css: { \'fa-folder-open-o\': isExpanded(), \'fa-folder-o\': !isExpanded() }"></i>\r\n    <em>Unbenannt</em>\r\n</script>\r\n\r\n<script type="text/html" id="draftfile-label">\r\n    <i class="fa fa-file-o fa-fw"></i> <span data-bind="text: title"></span>\r\n</script>\r\n\r\n<script type="text/html" id="draftfiles-group-template">\r\n    <div class="form-group">\r\n        <input type="text" data-bind="value: groupName" class="form-control input-lg" placeholder="Name der Gruppe" />\r\n    </div>\r\n\r\n    <div class="row draftfile-thumbnails" data-bind="foreach: childNodes">\r\n        <div class="col-xs-4 col-md-3 col-lg-2 thumbnails-fixed-size bottom-fixed-navbar-container-l2">\r\n            <div class="thumbnail-container">\r\n                <a class="thumbnail" data-bind="if: resource.FileVersion(), click: selectNode">\r\n                    <!-- ko template: { name: \'draftFiles-dbfile-icon\' } --><!-- /ko -->\r\n                </a>\r\n                <div class="thumbnail-label">\r\n                    <div class="pull-right">\r\n                        <a class="btn-link" data-bind="click: $root.removeFile, clickBubble: false, attr: { title: entity().Name() + \' entfernen\' }"><i class="fa fa-times"></i></a>\r\n                    </div>\r\n                    <span class="thumbnail-label-content" data-bind="text: entity().Name, attr: { title: entity().Name }"></span>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</script>\r\n\r\n<script type="text/html" id="draftfiles-file-template">\r\n    <div class="row">\r\n        <div class="col-md-8" data-bind="forceViewportHeight: { minWidth: 992 }">\r\n            <!-- ko if: resource.FileVersion() -->\r\n            <!-- ko template: { name: \'draftFiles-dbfile-preview\' } --><!-- /ko -->\r\n            <!-- /ko -->\r\n        </div>\r\n        <div class="col-md-4">\r\n            <form role="form">\r\n                <div class="form-group">\r\n                    <label class="control-label">Titel</label>\r\n                    <input type="text" class="form-control" data-bind="value: resource.Title" />\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label class="control-label">Beschreibung</label>\r\n                    <textarea data-bind="value: resource.Description" class="form-control" rows="3" />\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label class="control-label">Verwendung</label>\r\n                    <select class="form-control" data-bind="options: $parent.determinations, optionsText: \'title\', optionsValue: \'name\', value: entity().Determination, optionsCaption: \'Bitte wählen...\'"></select>\r\n                </div>\r\n\r\n                <!-- ko if: showGroup -->\r\n                <div class="form-group">\r\n                    <label class="control-label">In Ordner verschieben <a href="#" class="space-left" data-bind="click: cancelSelectGroup" title="Abbrechen"><i class="fa fa-times-circle"></i></a></label>\r\n                    <select class="form-control" data-bind="options: $parent.groupNames, value: entity().Group, optionsCaption: \'Bitte wählen...\', event: { change: groupNameChanged }"></select>\r\n                </div>\r\n                <!-- /ko -->\r\n\r\n                <ul class="list-unstyled">\r\n                    <!-- ko if: !showGroup() -->\r\n                    <li>                        \r\n                        <a href="#" data-bind="click: selectGroup"><i class="fa fa-arrows fa-fw"></i> In Ordner verschieben</a>\r\n                    </li>                    \r\n                    <!-- /ko -->\r\n                    <li>\r\n                        <a href="#" data-bind="click: $parent.removeFile"><i class="fa fa-times fa-fw"></i> Anhang entfernen</a>\r\n                    </li>\r\n                </ul>\r\n                <ul class="list-unstyled">\r\n                    <li>\r\n                        <a href="#" data-bind="attr: { href: \'DbFileContent/Inline/\' + resource.FileVersion().Id() }" target="_blank"><i class="fa fa-external-link fa-fw"></i> Anhang öffnen</a>\r\n                    </li>\r\n                    <li>\r\n                        <a href="#" data-bind="attr: { href: \'DbFileContent/Download/\' + resource.FileVersion().Id() }"><i class="fa fa-download fa-fw"></i> Anhang herunterladen</a>\r\n                    </li>\r\n                    <li>\r\n                        <a href="#" data-bind="click: $parent.navigateToFile"><i class="fa fa-arrow-right fa-fw"></i> Zu Datei wechseln</a>\r\n                    </li>\r\n                </ul>\r\n                \r\n                <div class="form-group">\r\n                    <label class="control-label">Adresse</label>\r\n                    <p data-bind="text: \'caps://content-file/\' + encodeURIComponent(resource.FileVersion().File().FileName())" class="form-control-static"></p>\r\n                </div>\r\n            </form>\r\n        </div>\r\n    </div>\r\n</script>\r\n\r\n<script type="text/html" id="draftFiles-dbfile-preview">\r\n    <!-- ko with: resource.FileVersion() -->\r\n    <!-- ko if: File().isImage && File().isImage() -->\r\n    <div class="file-preview image-preview" data-bind="stretchLineHeight: true">\r\n        <img data-bind="attr: { src: $root.server.mapPath(\'~/DbFileContent/Inline/\' + Id() + \'?h=\' + Hash()) }" />\r\n    </div>\r\n    <!-- /ko -->\r\n    <!-- ko if: File().isImage && !File().isImage() -->\r\n    <div class="file-preview unknown-preview">\r\n        <span><i class="fa fa-file fa-5x"></i></span>\r\n    </div>\r\n    <!-- /ko -->\r\n    <!-- /ko -->\r\n</script>';});

define('text!modules/draft/views/editor/draftNotes.html',[],function () { return '<div class="content-editor" data-bind="forceViewportHeight: { minWidth: 992 }">\r\n    <textarea class="form-control" data-bind="value: editor.entity().Notes" placeholder="Notizen..."></textarea>\r\n</div>';});

define('text!modules/draft/views/editor/draftProperties.html',[],function () { return '\r\n<div class="row">\r\n    <div class="col-md-6">\r\n        <div class="form-group">\r\n            <label class="col-md-5 col-lg-4">Erstellt von</label>\r\n            <p class="form-static-control col-md-7 col-lg-8"><span data-bind="text: createdBy"></span> <span data-bind="text: createdFromNow, attr: { title: createdAt }"></span></p>\r\n        </div>\r\n\r\n        <div class="form-group">\r\n            <label class="col-md-5 col-lg-4">Letzte Änderung</label>\r\n            <p class="form-static-control col-md-7 col-lg-8"><span data-bind="text: modifiedBy"></span> <span data-bind="text: modifiedFromNow, attr: { title: modifiedAt }"></span></p>\r\n        </div>\r\n\r\n        <div class="form-group">\r\n            <label class="col-md-5 col-lg-4">Id</label>\r\n            <p class="form-static-control col-md-7 col-lg-8"><span data-bind="text: editor.entity().Id"></span></p>\r\n        </div>\r\n\r\n        <div class="form-group">\r\n            <label class="col-md-5 col-lg-4">Version</label>\r\n            <p class="form-static-control col-md-7 col-lg-8"><span data-bind="text: editor.entity().Version"></span></p>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="col-md-6">\r\n        <div class="form-group">\r\n            <label for="draftStatus" class="control-label">Status</label>\r\n            <select class="form-control" data-bind="options: editor.draftStates, optionsValue: \'value\', optionsText: \'title\', value: editor.entity().Status" id="draftStatus"></select>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/editor/draftTemplate.html',[],function () { return '\r\n<div class="draft-template-container panel-scroll-v" data-bind="if: editor.template(), forceViewportHeight: { spacers: \'.draft-template-nav\', minWidth: 992 }">\r\n    <!-- ko if: !showPreview() -->\r\n    <!-- ko template: \'draft-template-layout-overview\' --><!-- /ko -->\r\n    <!-- /ko -->\r\n    <!-- ko if: showPreview() -->\r\n    <!-- ko template: \'draft-template-layout-preview\' --><!-- /ko -->\r\n    <!-- /ko -->\r\n</div>\r\n\r\n<div class="draft-template-nav">\r\n    <div class="pull-right">\r\n        <a href="#" data-bind="click: togglePreview"><i class="glyphicon" data-bind="css: { \'glyphicon-eye-open\': !showPreview(), \'glyphicon-eye-close\': showPreview() }"></i></a>\r\n    </div>\r\n    <div>\r\n        <a href="#" data-bind="click: editor.showTemplateEditor"><i class="fa fa-edit"></i> Vorlage bearbeiten</a>\r\n    </div>\r\n</div>\r\n\r\n<script type="text/html" id="draft-template-layout-overview">\r\n    <div class="draft-template-layout">\r\n        <!-- ko foreach: { data: editor.template().rows, as: \'row\' } -->\r\n        <div class="draft-template-row">\r\n            <!-- ko foreach: { data:row.cells, as: \'cell\' } -->\r\n            <div class="draft-template-part" data-bind="draftTemplateClass: cell, click: $parents[1].editContentPart">\r\n                <div>\r\n                    <!--<p>\r\n                        <a href="#" data-bind="click: $parents[1].editContentPart"><i class="fa fa-edit"></i> <span data-bind="text:title"></span></a>\r\n                    </p>-->\r\n                    <h4 data-bind="text:title"></h4>\r\n                    <p>\r\n                        <i data-bind="text: $parents[1].previewText($data)"></i>\r\n                    </p>\r\n                </div>\r\n            </div>\r\n            <!-- /ko -->\r\n        </div>\r\n        <!-- /ko -->\r\n    </div>\r\n</script>\r\n\r\n\r\n<script type="text/html" id="draft-template-layout-preview">\r\n    <div class="draft-template-preview">\r\n        <!-- ko foreach: { data: editor.template().rows, as: \'row\' } -->\r\n        <div class="row">\r\n            <!-- ko foreach: { data:row.cells, as: \'cell\' } -->\r\n            <div data-bind="draftTemplateClass: cell">\r\n                <div class="template-preview-cell" data-bind="html: $parents[1].prepareCellContent($data)"></div>\r\n            </div>\r\n            <!-- /ko -->\r\n        </div>\r\n        <!-- /ko -->\r\n    </div>\r\n</script>';});

define('text!modules/draft/views/editor/editor.html',[],function () { return '<div id="drafts-editor" class="app-page bottom-fixed-navbar-container subnav-fixed-top-container" data-bind="if: entity">\r\n\r\n    <div class="toolbar subnav-fixed-top drafts-editor-nav" data-bind="compose: currentNavigation"></div>\r\n\r\n    <div class="panel-padding-h">\r\n        <div class="row">\r\n            <div class="col-md-12 drafts-editor-pane">\r\n                <div data-bind="compose: currentContent"></div>\r\n            </div>\r\n        </div>\r\n    </div>        \r\n        \r\n    <div class="navbar navbar-default navbar-fixed-bottom">        \r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: navigateBack"><span><i class="fa fa-list"></i> Alle Inhalte</span></a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: saveChangesAndNavigateBack"><span><i class="fa fa-save"></i> Inhalt speichern</span></a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: deleteDraft"><span><i class="fa fa-trash-o"></i> Inhalt löschen</span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n\r\n</div>';});

define('text!modules/draft/views/editor/navigation.html',[],function () { return '<div class="row">\r\n    <div class="col-md-3" data-bind="css: { \'has-error\': !editor.entity().Name.isValid() }">\r\n        <input class="form-control" type="text" placeholder="Name" data-bind="value: editor.entity().Name, tooltip: { title: editor.entity().Name.error(), placement: \'bottom\', trigger: \'hover\' }" />\r\n    </div>\r\n    <div class="col-md-9">\r\n        <ul class="nav nav-tabs">\r\n            <li data-bind="css: { active: currentView() == \'DraftTemplate\' || currentView() == \'ContentPartEditor\' }">\r\n                <!--<a href="#" data-bind="click: editor.showEditorMain"><i class="fa fa-columns fa-fw"></i> Bereiche</a>-->\r\n                <div class="btn-group">\r\n                    <a class="btn" href="#" data-bind="click: editor.showLayoutArea"><i class="fa fa-columns fa-fw"></i> Layoutbereiche</a>\r\n                    <button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>\r\n                    <ul class="dropdown-menu" role="menu">\r\n                        <!-- ko foreach: contentParts-->\r\n                        <li role="presentation"><a href="#" data-bind="click: edit"><i class="fa fa-edit fa-fw"></i> <span data-bind="text: title"></span></a></li>\r\n                        <!-- /ko -->\r\n                        <li role="presentation" class="divider"></li>\r\n                        <li role="presentation"><a href="#" data-bind="click: editor.showEditorMain"><i class="fa fa-columns fa-fw"></i> Layoutübersicht</a></li>\r\n                    </ul>\r\n                </div>\r\n            </li>\r\n            <li data-bind="css: { active: currentView() == \'DraftFiles\' }"><a href="#" data-bind="click: editor.showFiles"><i class="fa fa-paperclip fa-fw"></i> Anhänge (<!-- ko text: numberOfFiles --><!-- /ko -->)</a></li>\r\n            <li data-bind="css: { active: currentView() == \'DraftProperties\' }"><a href="#" data-bind="click: editor.showProperties" title="Eigenschaften"><i class="fa fa-cogs fa-fw"></i></a></li>\r\n            <li data-bind="css: { active: currentView() == \'DraftNotes\' }"><a href="#" data-bind="click: editor.showDraftNotes" title="Notizen"><i class="fa fa-pencil fa-fw"></i></a></li>\r\n        </ul>\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/editor/templateEditor.html',[],function () { return '<div class="content-editor" data-bind="forceViewportHeight: { spacers: \'.contentpart-nav\', minWidth: 992 }">\r\n    <textarea class="form-control" data-bind="value: templateContent"></textarea>\r\n</div>\r\n<div class="contentpart-nav">\r\n    <div class="pull-right">\r\n        <strong class="space-right">Layoutvorlage</strong>\r\n    </div>\r\n    <a href="#" data-bind="click: editor.showEditorMain"><i class="fa fa-columns"></i> Layoutübersicht</a>\r\n</div>';});

define('text!modules/draft/views/index.html',[],function () { return '<div id="drafts-index" class="app-page bottom-fixed-navbar-container">\r\n\r\n    <div class="panel-padding-h">\r\n        <div class="row">\r\n            <div class="col-md-4 col-lg-3 left-fixed-sidebar">\r\n                <!-- ko compose: { model: searchControl } --><!-- /ko -->\r\n                <div data-bind="forceViewportHeight: { minWidth: 992 }, scrollTop: { observable: draftListScrollState.scrollTop, enabled: draftListScrollState.isEnabled }" class="panel-scroll-v">\r\n                    <ul data-bind="foreach: items" class="data-list">\r\n                        <li data-bind="css: { active: isSelected() }, click: $parent.selectDraft, scrollIntoViewTrigger: { source: scrollIntoViewRequest }">\r\n                            <div class="pull-left">\r\n                                <i class="fa fa-file-text-o fa-fw"></i>\r\n                            </div>\r\n                            <div class="pull-right">\r\n                                <small data-bind="text: modifiedAt"></small>\r\n                            </div>\r\n                            <div class="data-list-label text-ellipsis">\r\n                                <span data-bind="text: title"></span>\r\n                            </div>\r\n                            <div class="data-list-label">\r\n                                <small data-bind="text: status"></small>\r\n                            </div>\r\n                        </li>\r\n                    </ul>\r\n                </div>\r\n            </div>\r\n            <div class="col-md-offset-4 col-lg-offset-3 col-md-8 col-lg-9 draft-preview hidden-xs hidden-sm">\r\n                <!-- ko if: draftPreview() -->\r\n                <!-- ko template: { name: \'DraftPreviewTemplate\', data: draftPreview() } --><!-- /ko -->\r\n                <!-- /ko -->\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click:addDraft"><span><i class="fa fa-plus fa-fw"></i> Neuer Inhalt</span></a>\r\n                </li>\r\n                <li data-bind="visible: selectedItem()">\r\n                    <a href="#" data-bind="click:editSelectedDraft"><span><i class="fa fa-edit fa-fw"></i> Inhalt bearbeiten</span></a>\r\n                </li>\r\n                <li data-bind="visible: selectedItem()">\r\n                    <a href="#" data-bind="click:publishDraft"><span><i class="fa fa-share fa-fw"></i> Inhalt veröffentlichen</span></a>\r\n                </li>\r\n                <li data-bind="visible: selectedItem()">\r\n                    <a href="#" data-bind="click:deleteDraft"><span><i class="fa fa-trash-o fa-fw"></i> Inhalt löschen</span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n\r\n        <div class="navbar-panel pull-right">\r\n            <div class="navbar-text">\r\n                <span data-bind="text: items().length"></span> Inhalte\r\n            </div>\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" title="Aktualisieren" data-bind="click: refresh"><i class="fa fa-refresh fa-fw" data-bind="css: { \'fa-spin\': isLoading }"></i></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n<script type="text/html" id="DraftPreviewTemplate">\r\n    <div class="row">\r\n        <div class="col-md-12">\r\n            <div class="pull-left">\r\n                <span class="large-icon">\r\n                    <i class="fa fa-file-text-o fa-5x fa-inverse"></i>\r\n                </span>\r\n            </div>\r\n            <div class="pull-left">\r\n                <p class="light-text">\r\n                    <small data-bind="text: entity().Modified().By"></small> <small data-bind="text: modifiedFromNow(), attr: { title: modifiedAt() }"></small> <small data-bind="text: \'v.\' + entity().Version()"></small>\r\n                </p>\r\n                <h4><!-- ko text: entity().Name() --><!-- /ko --></h4>\r\n                <ul class="list-inline">\r\n                    <li>\r\n                        <span>Status: </span>\r\n                        <!-- ko text: entity().statusTitle() --><!-- /ko -->\r\n                    </li>\r\n                    <!-- ko if: supportedTranslations.length -->\r\n                    <li>\r\n                        <span>Sprache: </span>\r\n                        <!-- ko text: originalLanguage.localeName(\'de\') --><!-- /ko -->\r\n                    </li>\r\n                    <li>\r\n                        <span>Übersetzungen: </span>\r\n                        <!-- ko foreach: supportedTranslations -->\r\n                        <a data-bind="text: localeName(\'de\'), click: $parent.translateDraft" href="#"></a>\r\n                        <!-- /ko -->\r\n                    </li>\r\n                    <!-- /ko -->\r\n                </ul>\r\n            </div>\r\n        </div>\r\n    </div>\r\n    <div class="row">\r\n        <div class="col-md-12">\r\n            <section class="draft-preview-content">\r\n                <div class="draft-preview-box">\r\n                    <!-- ko foreach: { data: template().rows, as: \'row\' } -->\r\n                    <div class="row">\r\n                        <!-- ko foreach: { data:row.cells, as: \'cell\' } -->\r\n                        <div data-bind="draftTemplateClass: cell">\r\n                            <div class="template-preview-cell" data-bind="html: content"></div>\r\n                        </div>\r\n                        <!-- /ko -->\r\n                    </div>\r\n                    <!-- /ko -->\r\n                </div>\r\n            </section>\r\n        </div>\r\n    </div>\r\n    <!-- ko if: entity().Files().length > 0 -->\r\n    <div class="row draft-preview-panel" data-bind="with: entity()">\r\n        <div class="col-md-12">\r\n            <h6>Anhänge (<!-- ko text: Files().length --><!-- /ko -->)</h6>\r\n            <ul data-bind="foreach: Files()" class="list-inline">\r\n                <li><i class="fa fa-file"></i> <span data-bind="text: Name" /></li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n    <!-- /ko -->\r\n    <!-- ko if: entity().Notes() && entity().Notes().length -->\r\n    <div class="row draft-preview-panel" data-bind="with: entity()">\r\n        <div class="col-md-12">\r\n            <h6>Notizen</h6>\r\n            <pre data-bind="text: Notes"></pre>\r\n        </div>\r\n    </div>\r\n    <!-- /ko -->\r\n    <!-- ko if: publications().length > 0 -->\r\n    <div class="row draft-preview-panel">\r\n        <div class="col-md-12">\r\n            <h6>Veröffentlichungen (<!-- ko text: publications().length --><!-- /ko -->)</h6>\r\n            <ul data-bind="foreach: publications()" class="list-unstyled">\r\n                <li>\r\n                    <i class="fa fa-share-square-o"></i> <span data-bind="text: title" /> \r\n                    (<em data-bind="text: modifiedBy"></em> <em data-bind="text: modifiedAt"></em>, <em data-bind="text: contentVersion"></em>)\r\n                    <!-- ko if: isOutdated -->\r\n                    &nbsp;<a href="#" data-bind="click: republish"><i class="fa fa-refresh"></i> Aktualisieren</a>\r\n                    <!-- /ko -->\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n    <!-- /ko -->\r\n</script>';});

define('text!modules/draft/views/templateGallery.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n    <div class="panel-padding-h">\r\n        <h1>Wähle eine Vorlage</h1>\r\n\r\n        <div class="row">\r\n            <div class="col-md-8">\r\n                <div class="row" data-bind="foreach: listItems">\r\n                    <div class="col-xs-4 col-md-3 col-lg-2" data-bind="css: { \'item-selected\': isSelected }">\r\n                        <div class="thumbnail">\r\n                            <img data-bind="attr: { alt: name, src: icon }, click: $parent.selectTemplate" class="clickable" />\r\n                            <div class="caption">\r\n                                <h4 data-bind="text: title"></h4>\r\n                                <a href="#" data-bind="click: $parent.selectTemplate">Vorlage wählen</a>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <div class="col-md-3">\r\n                <div class="form-group">\r\n                    <label class="control-label">Name</label>\r\n                    <input type="text" class="form-control" data-bind="value: draftName" />\r\n                </div>\r\n\r\n                <!-- ko if: selectedItem() && selectedItem().template.parameters -->\r\n                <!-- ko foreach: selectedItem().template.parameters -->\r\n                <div class="form-group">\r\n                    <label class="control-label" data-bind="text: title"></label>\r\n                    <input type="text" class="form-control" data-bind="value: value" />\r\n                </div>\r\n                <!-- /ko -->\r\n                <!-- /ko -->\r\n\r\n                <p>\r\n                    <button class="btn btn-primary btn-lg" data-bind="click: createDraft">Erstellen</button>\r\n                </p>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: cancel"><span><i class="fa fa-arrow-left"></i> Abbrechen</span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/translator/contentPartEditor.html',[],function () { return '<div class="row editor-header">\r\n    <div class="col-md-6">\r\n        <span>Original (Deutsch)</span>\r\n    </div>\r\n    <div class="col-md-6">\r\n        <span data-bind="text: \'Übersetzung (\' + editor.language().localeName(\'de\') + \')\'"></span>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="col-md-6 content-editor" data-bind="forceViewportHeight: { minWidth: 992 }">\r\n        <div class="textarea-disabled" data-bind="html: originalContent" />\r\n    </div>\r\n    <div class="col-md-6 content-editor" data-bind="forceViewportHeight: { minWidth: 992 }">\r\n        <textarea class="form-control" data-bind="value: resource.Content, attr: { lang: editor.language().culture }" />\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/translator/draftFiles.html',[],function () { return '<div class="row editor-header">\r\n    <div class="col-md-6">\r\n        <span>Original (Deutsch)</span>\r\n    </div>\r\n    <div class="col-md-6">\r\n        <span data-bind="text:editor.language().localeName(\'de\')"></span>\r\n    </div>\r\n</div>\r\n\r\n<section data-bind="foreach: editor.files" class="thumbnail-list">\r\n    <div class="row">\r\n        <div class="col-md-2">\r\n            <div class="thumbnail-container">\r\n                <a class="thumbnail">\r\n                    <!-- ko template: { name: \'dbfile-icon\', data: original.FileVersion() } --><!-- /ko -->\r\n                </a>\r\n            </div>\r\n        </div>\r\n        <div class="col-md-4">\r\n            <form role="form" class="form-horizontal">\r\n                <div class="form-group">\r\n                    <label class="col-md-2">Titel</label>\r\n                    <div class="col-md-10">\r\n                        <input type="text" class="form-control" data-bind="value: original.Title" disabled="disabled" />\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label class="col-md-2">Beschreibung</label>\r\n                    <div class="col-md-10">\r\n                        <textarea data-bind="value: original.Description" class="form-control" disabled="disabled" />\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label class="col-md-2">Akkreditierung</label>\r\n                    <div class="col-md-10">\r\n                        <input type="text" class="form-control" data-bind="value: original.Credits" disabled="disabled" />\r\n                    </div>\r\n                </div>\r\n            </form>\r\n        </div>\r\n\r\n\r\n        <div class="col-md-2">\r\n            <div class="thumbnail-container">\r\n                <a class="thumbnail" href="#">\r\n                    <!-- ko if: FileVersion() -->\r\n                    <!-- ko template: { name: \'dbfile-icon\', data: FileVersion() } --><!-- /ko -->\r\n                    <!-- /ko -->\r\n                </a>\r\n                <a href="#" data-bind="click: selectFile">Datei wählen...</a>\r\n                <!-- ko if: translation.FileVersion() -->\r\n                <a href="#" data-bind="click: resetFile"><i class="fa fa-times"></i></a>\r\n                <!-- /ko -->\r\n            </div>\r\n        </div>\r\n        <div class="col-md-4">\r\n            <form role="form" class="form-horizontal">\r\n                <div class="form-group">\r\n                    <label class="col-md-2">Titel</label>\r\n                    <div class="col-md-10">\r\n                        <input type="text" class="form-control" data-bind="value: translation.Title, attr: { lang: $parent.editor.language().culture }" />\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label class="col-md-2">Beschreibung</label>\r\n                    <div class="col-md-10">\r\n                        <textarea data-bind="value: translation.Description, attr: { lang: $parent.editor.language().culture }" class="form-control" />\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label class="col-md-2">Akkreditierung</label>\r\n                    <div class="col-md-10">\r\n                        <input type="text" class="form-control" data-bind="value: translation.Credits, attr: { lang: $parent.editor.language().culture }" />\r\n                    </div>\r\n                </div>\r\n            </form>\r\n        </div>\r\n    </div>\r\n    <div class="separator"></div>\r\n</section>\r\n\r\n<script type="text/html" id="dbfile-icon">\r\n    <!-- ko if: File().isImage() -->\r\n    <img src="/content/images/blank.gif" data-bind="attr: { \'data-src\': \'DbFileContent/Thumbnail/\' + Id() + \'?thumbnailName=220x160\', title: File().FileName, alt: File().FileName }, lazyImage: true" />\r\n    <!-- /ko -->\r\n    <!-- ko if: !File().isImage() -->\r\n    <span data-bind="attr: { title: File().FileName }"><i class="fa fa-file fa-4x"></i></span>\r\n    <!-- /ko -->\r\n</script>';});

define('text!modules/draft/views/translator/draftProperties.html',[],function () { return '<div class="row editor-header">\r\n    <div class="col-md-6">\r\n        <span>Original (Deutsch)</span>\r\n    </div>\r\n    <div class="col-md-6">\r\n        <span data-bind="text:editor.language().localeName(\'de\')"></span>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="col-md-6">\r\n        \r\n        <div class="form-group">\r\n            <label class="col-md-2">Name</label>\r\n            <div class="col-md-10">\r\n                <input type="text" data-bind="value: editor.entity().Name" class="form-control" disabled="disabled" />\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="col-md-6">\r\n        <div class="form-group">\r\n            <label class="col-md-2">Name</label>\r\n            <div class="col-md-10">\r\n                <input type="text" data-bind="value: translation.TranslatedName, attr: { lang: editor.language().culture }" class="form-control" />\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!modules/draft/views/translator/navigation.html',[],function () { return '<h4 class="nav-header"><!-- ko text: editor.entity().Name --><!-- /ko --> <small>Übersetzung</small></h4>\r\n<ul data-bind="foreach: contentParts" class="nav nav-pills nav-stacked">\r\n    <li data-bind="css: { active: contentPart.Name() === $parent.currentContentPart() }">\r\n        <a data-bind="click: editContentPart" href="#"><i class="fa fa-arrow-right fa-fw"></i> <!-- ko text: templateCell.title --><!-- /ko --></a>\r\n    </li>\r\n</ul>\r\n<ul class="nav nav-pills nav-stacked">\r\n    <li data-bind="css: { active: currentView() == \'DraftFiles\'}"><a data-bind="click: editor.showFiles" href="#"><i class="fa fa-files-o fa-fw"></i> Dateien (<!-- ko text: numberOfFiles --><!-- /ko -->)</a></li>\r\n    <li data-bind="css: { active: currentView() == \'DraftProperties\'}"><a data-bind="click: editor.showProperties" href="#"><i class="fa fa-cogs fa-fw"></i> Eigenschaften</a></li>\r\n</ul>';});

define('text!modules/draft/views/translator/translator.html',[],function () { return '<div id="drafts-translator" class="app-page bottom-fixed-navbar-container">\r\n\r\n    <div class="panel-padding-h">\r\n        <div class="row">\r\n            <div class="col-md-8 col-lg-9">\r\n                <div data-bind="compose: currentContent"></div>\r\n            </div>\r\n            <div class="col-md-4 col-lg-3 draft-navigation">\r\n                <div data-bind="compose: currentNavigation"></div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: navigateBack"><span><i class="fa fa-arrow-left"></i> Zurück</span></a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: saveChanges"><span><i class="fa fa-save"></i> Speichern</span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n\r\n</div>';});

define('modules/sitemap/entities',["ko","authentication"],function(e,t){function n(){var t=this;t.sortedSiteMapVersions=e.computed({read:function(){return items=t.SiteMapVersions().slice(0),items.sort(function(e,t){var n=e.Version(),r=t.Version();return n==r?0:n>r?-1:1}),items},deferEvaluation:!0})}function r(){}function i(t){t.rootNodes=e.computed({read:function(){return e.utils.arrayFilter(t.SiteMapNodes(),function(e){return!e.ParentNodeId()})},deferEvaluation:!0}),t.siblings=e.computed(function(){return t.Website()?t.Website().SiteMapVersions():[]})}function a(e,t){var n=e&&e.Version?e.Version():0,r=t&&t.Version?t.Version():0;return n==r?0:n>r?1:-1}function o(e,t){var n=e&&e.Version?e.Version():0,r=t&&t.Version?t.Version():0;return n==r?0:r>n?1:-1}function s(){}function l(t){t.childNodes=e.computed({read:function(){if(!t.SiteMap()||!t.SiteMap().SiteMapNodes())return[];var n=e.utils.arrayFilter(t.SiteMap().SiteMapNodes(),function(e){return e.ParentNodeId()===t.Id()});return n.sort(c),n},deferEvaluation:!0}),t.siblings=e.computed({read:function(){return t.ParentNode()?t.ParentNode().childNodes():[]},deferEvaluation:!0}),t.nextNode=e.computed({read:function(){var e=t.siblings(),n=e.indexOf(t);return n==e.length-1?void 0:e[n+1]},deferEvaluation:!0}),t.previousNode=e.computed({read:function(){var e=t.siblings(),n=e.indexOf(t);return 0===n?void 0:e[n-1]},deferEvaluation:!0}),t.path=e.computed({read:function(){for(var e=[],n=t;n;){var r=n.getResource("de"),i=r?r.Title():"no-res";e.splice(0,0,i),n=n.ParentNode()}return e.join("/")},deferEvaluation:!0}),t.canLinkTo=e.computed(function(){return!t.isTeaser()}),t.canHaveContent=e.computed(function(){return!t.isTeaser()})}function u(e){for(var t=0;t<e.length;t++)e[t].Ranking()!==t+1&&e[t].Ranking(t+1)}function c(e,t){var n=e.Ranking(),r=t.Ranking();return n==r?e.Id()<t.Id()?-1:1:r>n?-1:1}function d(){var t=this;t.template=e.computed({read:function(){return t.deserializeTemplate()},deferEvaluation:!0})}function f(){}function p(){}return n.prototype.latestSiteMap=function(){var t=Math.max.apply(null,e.utils.arrayMap(this.SiteMapVersions(),function(e){return e.Version()}));return e.utils.arrayFirst(this.SiteMapVersions(),function(e){return e.Version()===t})},r.prototype.previousVersion=function(){var t=this,n=e.utils.arrayFilter(t.siblings(),function(e){return e.Version()<t.Version()});return n.length?(n.sort(o),n[0]):void 0},r.prototype.nextVersion=function(){var t=this,n=e.utils.arrayFilter(t.siblings(),function(e){return e.Version()>t.Version()});return n.length?(n.sort(a),n[0]):void 0},r.prototype.setDeleted=function(){this.rootNodes().slice(0).forEach(function(e){e.setDeleted()}),this.entityAspect.setDeleted()},r.prototype.createNewVersion=function(t,n){var r=n.createEntity("DbSiteMap",{WebsiteId:this.WebsiteId(),Version:t});return e.utils.arrayForEach(this.rootNodes(),function(e){e.clone(n,r,null)}),n.addEntity(r),r},r.prototype.containsNode=function(e){return e&&e.SiteMapId()===this.Id()},s.prototype.getResource=function(t){var n=t.toLowerCase();return e.utils.arrayFirst(this.Resources(),function(e){return e.Language().toLowerCase()===n})},s.prototype.getOrCreateResource=function(e,t){var n=e.toLowerCase(),r=this.getResource(e);return r?r:(r=t.createEntity("DbSiteMapNodeResource",{SiteMapNodeId:this.Id(),Language:n}),t.addEntity(r),r)},s.prototype.localeTitle=function(){var e=this.getResource("de");return e?e.Title():""},s.prototype.setDeleted=function(){for(var e=this.childNodes().slice(0),t=this.Resources().slice(0),n=0;n<e.length;n++)e[n].setDeleted();for(n=0;n<t.length;n++)t[n].entityAspect.setDeleted();this.entityAspect.setDeleted()},s.prototype.clone=function(t,n,r){var i={SiteMapId:n.Id(),ParentNodeId:r,ContentId:this.ContentId(),PermanentId:this.PermanentId(),Name:this.Name(),Ranking:this.Ranking(),NodeType:this.NodeType(),IsDeleted:this.IsDeleted(),Redirect:this.Redirect(),RedirectType:this.RedirectType()},a=t.createEntity("DbSiteMapNode",i);return a.Created().At(this.Created().At()),a.Created().By(this.Created().By()),a.Modified().At(this.Modified().At()),a.Modified().By(this.Modified().By()),e.utils.arrayForEach(this.Resources(),function(e){var n=a.getOrCreateResource(e.Language(),t);n.Title(e.Title()),n.Keywords(e.Keywords()),n.Description(e.Description())}),e.utils.arrayForEach(this.ChildNodes(),function(e){e.clone(t,n,a.Id())}),t.addEntity(a),a},s.prototype.maxChildNodeRanking=function(){var t=this.childNodes();return 0===t.length?0:1===t.length?t[0].Ranking():Math.max.apply(null,e.utils.arrayMap(t,function(e){return e.Ranking()}))},s.prototype.moveUp=function(){var e=this.siblings().slice(0),t=e.indexOf(this);0>=t||(e.splice(t,1),e.splice(t-1,0,this),u(e))},s.prototype.moveDown=function(){var e=this.siblings().slice(0),t=e.indexOf(this);t>=e.length-1||(e.splice(t,1),e.splice(t+1,0,this),u(e))},s.prototype.reparent=function(e){e&&e.Id()!==this.ParentNodeId()&&(this.ParentNodeId(e.Id()),this.Ranking(e.maxChildNodeRanking()+1))},s.prototype.findTeasers=function(){var t=this,n=t.SiteMap();return n?e.utils.arrayFilter(n.SiteMapNodes(),function(e){return e.isTeaser()&&e.Redirect()==t.PermanentId()}):[]},s.prototype.hasTeasers=function(){var e=this.findTeasers();return e.length>0},s.prototype.isTeaser=function(){return"teaser"===this.NodeType().toLowerCase()},d.prototype.getTranslation=function(t){var n=t.toLowerCase();return e.utils.arrayFirst(this.Translations(),function(e){return e.Language().toLowerCase()===n})},d.prototype.getContentPart=function(t){var n=t.toLowerCase();return e.utils.arrayFirst(this.ContentParts(),function(e){return e.Name().toLowerCase()===n})},d.prototype.getOrCreateContentPart=function(e,t){var n=e.toLowerCase(),r=this.getContentPart(n);return r?r:(r=t.createEntity("PublicationContentPart",{PublicationId:this.Id(),Name:n,ContentType:"html",Ranking:0}),t.addEntity(r),this.ContentParts.push(r),r)},d.prototype.deserializeTemplate=function(){var e=JSON.parse(this.Template());return e?(e.findCell=function(t){for(var n=0;n<e.rows.length;n++)for(var r=e.rows[n],i=0;i<r.cells.length;i++){var a=r.cells[i];if(a.name.toLowerCase()===t.toLowerCase())return a}return void 0},e):void 0},d.prototype.setDeleted=function(){e.utils.arrayForEach(this.ContentParts(),function(e){e.setDeleted()}),e.utils.arrayForEach(this.Files(),function(e){e.setDeleted()}),this.entityAspect.setDeleted()},d.prototype.findFile=function(t,n){n=n||"de";var r=t.toLowerCase(),i=e.utils.arrayFirst(this.Files(),function(e){var t=e.getResource(n);return t?t.FileVersion()&&t.FileVersion().File().FileName().toLowerCase()===r:!1});return i},d.prototype.generateContentData=function(n){function r(){return{at:new Date,by:t.user().userName()}}function i(t,n){var i=e.utils.arrayMap(n.Resources(),function(e){return{language:e.Language(),title:e.Title(),created:r(),modified:r()}});return i}function a(t){return e.utils.arrayMap(t.ContentParts(),function(e){return{name:e.Name(),contentType:e.ContentType(),ranking:e.Ranking(),resources:o(t,e.Resources())}})}function o(t,n){return e.utils.arrayMap(n,function(e){return{language:e.Language(),content:e.Content()}})}function s(t){return e.utils.arrayMap(t.Files(),function(e){return{name:e.Name(),isEmbedded:e.IsEmbedded(),determination:e.Determination(),group:e.Group(),ranking:e.Ranking(),resources:l(e.Resources())}})}function l(t){return e.utils.arrayMap(t,function(e){return{language:e.Language(),dbFileVersionId:e.DbFileVersionId(),title:e.Title(),description:e.Description(),credits:e.Credits()}})}var u=this;return{entityType:"Publication",entityId:u.Id(),version:u.ContentVersion(),name:n.Name(),template:u.Template(),created:r(),modified:r(),resources:i(u,n),contentParts:a(u),files:s(u)}},f.prototype.getResource=function(t){var n=t.toLowerCase();return e.utils.arrayFirst(this.Resources(),function(e){return e.Language().toLowerCase()===n})},f.prototype.getOrCreateResource=function(e,t){var n=e.toLowerCase(),r=this.getResource(e);return r?r:(r=t.createEntity("PublicationContentPartResource",{PublicationContentPartId:this.Id(),Language:n}),t.addEntity(r),this.Resources.push(r),r)},f.prototype.setDeleted=function(){e.utils.arrayForEach(this.Resources(),function(e){e.entityAspect.setDeleted()}),this.entityAspect.setDeleted()},p.prototype.getResource=function(t){var n=t.toLowerCase();return e.utils.arrayFirst(this.Resources(),function(e){return e.Language().toLowerCase()===n})},p.prototype.getOrCreateResource=function(e,t){var n=e.toLowerCase(),r=this.getResource(e);return r?r:(r=t.createEntity("PublicationFileResource",{PublicationFileId:this.Id(),Language:n}),t.addEntity(r),this.Resources.push(r),r)},p.prototype.setDeleted=function(){e.utils.arrayForEach(this.Resources(),function(e){e.entityAspect.setDeleted()}),this.entityAspect.setDeleted()},{extendModel:function(e){e.registerEntityTypeCtor("Website",n),e.registerEntityTypeCtor("DbSiteMap",r,i),e.registerEntityTypeCtor("DbSiteMapNode",s,l),e.registerEntityTypeCtor("Publication",d),e.registerEntityTypeCtor("PublicationContentPart",f),e.registerEntityTypeCtor("PublicationFile",p)}}});
define('text!modules/sitemap/module.html',[],function () { return '<div id="sitemapModule">\r\n    <!--ko router: { transition:\'entrance\', cacheViews:true }--><!--/ko-->\r\n</div>';});

define('modules/sitemap/module',["durandal/app","infrastructure/moduleFactory","infrastructure/moduleRouter","./entities"],function(e,t,n,r){var i=t.createModule({route:"sitemap*details",moduleId:"modules/sitemap/module",title:"Sitemap",nav:10,hash:"#sitemap"});return i.extendModel=r.extendModel,i.initializeRouter=function(){i.router=n.createModuleRouter(i,"modules/sitemap","sitemap").map([{route:"",moduleId:"viewmodels/index",title:"Sitemap",nav:!1},{route:"edit/:siteMapNodeId",moduleId:"viewmodels/editor",title:"Knoten bearbeiten",nav:!1},{route:"translate/:siteMapNodeId/:language",moduleId:"viewmodels/translator",title:"Übersetzung",nav:!1}]).buildNavigationModel()},e.on("caps:started",function(){require(["modules/sitemap/viewmodels/siteMapNodeSelectionDialog"],function(e){e.install()})}),e.on("caps:contentfile:navigateToResourceOwner",function(e){e.PublicationFile&&i.router.navigate("#sitemap?p="+e.PublicationFile().PublicationId())}),i});
define('modules/sitemap/viewmodels/editor',["../module","ko","entityManagerProvider","breeze","durandal/app","localization"],function(e,t,n,r,i,a){function o(){function r(e){var t=(new s).from("SiteMapNodes").where("Id","==",e).expand("Resources");return c.executeQuery(t)}function o(e){if(!e||!e.length)return u();var n=t.utils.arrayFirst(l,function(e){return e.name&&e.name.toLowerCase()===d.entity().NodeType().toLowerCase()});return n||u()}function u(){return t.utils.arrayFirst(l,function(e){return e.isCustomType})}var c,d=this;d.entity=t.observable(),d.nodeTypes=l,d.nodeType=t.observable(),d.supportedTranslations=a.website.supportedTranslations(),d.nodeType.subscribe(function(e){e&&e.name&&d.entity().NodeType(e.name)}),d.activate=function(e){c=n.createManager(),r(e).then(function(e){d.entity(e.results[0]),d.nodeType(o(e.results[0].NodeType()))})},d.navigateBack=function(){e.router.navigate(e.routeConfig.hash)},d.saveChanges=function(){c.saveChanges().then(function(){i.trigger("caps:sitemapnode:saved",d.entity()),d.navigateBack()})},d.editTranslation=function(t){d.entity()&&e.router.navigate("#sitemap/translate/"+d.entity().Id()+"/"+t.culture)}}var s=r.EntityQuery,l=[{title:"Inhalts-Seite",name:"PAGE"},{title:"Statische Seite",name:"ACTION"},{title:"Startseite",name:"ROOT",isRoot:!0},{title:"Aufmacher",name:"TEASER"},{title:"Benutzerdefiniert",isCustomType:!0,name:""}];return o});
define('modules/sitemap/viewmodels/publicationViewModel',["ko","infrastructure/contentReferences","infrastructure/urlHelper","infrastructure/contentControls"],function(e,t,n,r){function i(t){var n=this,i=null!=t?t.Content():null;n.publication=i,n.template=e.observable(i?i.template():null),n.files=e.computed(function(){return i?i.Files():[]}),n.findContentPart=function(e){if(i){var t=i.getContentPart(e.name);if(t){var n=t.getResource("de");if(n){var o=a.replaceReferences(i,n.Content(),"de");return o=r.replaceContentControls(o)}}}return""}}var a=new t({replaceFileReference:function(e,t){var r=e.context,i=r.findFile(e.fileName),a=i?i.getResource(t):void 0,o=a?a.FileVersion():void 0;return n.getFileUrl(e.fileName,o,e.query)},replacePublicationReference:function(e,t){return n.getPublicationUrl(e.id,t,e.query)}});return i});
define('modules/sitemap/viewmodels/index',["../module","ko","plugins/router","durandal/system","durandal/app","localization","./siteMapViewModel","./publicationViewModel","infrastructure/publicationService","authentication","../datacontext","durandal/composition","moment","infrastructure/keyboardHandler","infrastructure/scrollState"],function(e,t,n,r,i,a,o,s,l,u,c,d,f,p,h){function m(e){x(e)&&c.fetchSiteMapNode(e.Id()).then(function(){T()&&T().refreshTree(),b()})}function v(e){P(null),e&&e.fetchTree().then(function(){if(P()){var t=e.tree().findNodeByKey(P().Id());if(t)return t.selectNode(),void 0}e.selectRootNode()})}function g(e){_(null),b(),y(e)}function b(){E(null),P()&&P().ContentId()&&c.fetchPublication(P().ContentId()).then(function(){var e=new s(P());E(e)}).fail(C)}function y(e){R(null),e&&R(new F(e))}function w(e){var n=t.utils.arrayFirst(U.siteMapVersions(),function(t){return t.entity()===e});T(n)}function k(e){var t=new o(e);return t.selectedNodeChanged=function(e){e&&P(e.entity())},t}function x(e){return T()&&T().containsNode(e)}function C(e){r.log(e.message),alert(e.message)}function N(e){var t=T();if(t&&e){var n=e.nextNode()||e.previousNode()||e.ParentNode();c.deleteSiteMapNode(e).then(function(){t.refreshTree(),n&&t.selectNodeByKey(n.Id()),i.trigger("caps:sitemapnode:deleted",e)}).fail(C)}}function D(){c.fetchFirstWebsite().then(function(e){M(e.results[0]),w(M().latestSiteMap())}).fail(C)}function S(e){c.fetchSiteMapNodeByContentId(e).then(function(e){if(!e.results.length)return D(),void 0;var t=e.results[0],n=t.SiteMap();M(n.Website()),w(n),P(t)}).fail(C)}function I(e){var n=this;n.entity=e,n.isSelected=t.computed(function(){return _()===n}),n.selectTeaser=function(){_(n),y(n.entity)}}function F(n){var r=this;r.entity=n,r.supportedTranslations=a.website.supportedTranslations(),r.edit=function(){n&&e.router.navigate("#sitemap/edit/"+n.Id())},r.editTranslation=function(t){n&&e.router.navigate("#sitemap/translate/"+n.Id()+"/"+t.culture)},r.createTeaser=function(){if(n){var e=n.SiteMap().Id(),t=n.SiteMap().rootNodes()[0].Id();l.createTeaser(e,t,n.Id())}},r.canCreateTeaser=function(){return n?"ROOT"==n.NodeType()||n.hasTeasers()?!1:n.isTeaser()?!1:!0:!1},r.deleteTeaser=function(){var e="Aufmacher löschen",t="Abbrechen";i.showMessage('Soll der Aufmacher "'+r.entity.localeTitle("de")+'" wirklich gelöscht werden?',"Aufmacher löschen",[e,t]).then(function(t){t===e&&N(r.entity)})},r.hasOptions=t.computed(function(){return r.entity.isTeaser()||r.canCreateTeaser()}),r.hasContent=t.computed(function(){return n&&n.Content()}),r.contentSummary=t.computed(function(){if(!n.ContentId())return"Kein Inhalt festgelegt";var e=n.Content();return e?e.EntityType()+" #"+e.EntityKey()+" (v."+e.ContentVersion()+")":""}),r.authorSummary=t.computed(function(){if(!n.ContentId()||!n.Content())return"";var e=n.Content();return e.AuthorName()+" "+f(e.ContentDate()).fromNow()}),r.selectContent=function(){function t(e){l.setNodeContent(r.entity.Id(),e).fail(function(e){alert(e.message)})}isActive=!1,i.selectContent({module:e}).then(function(e){e.dialogResult&&t(e.selectedContent)}).finally(function(){isActive=!0})},r.editContent=function(){n.ContentId()&&n.Content()&&i.editContent(n.Content().EntityType(),n.Content().EntityKey())}}var M=t.observable(),T=t.observable(),P=t.observable(),E=t.observable(),_=t.observable(),R=t.observable(),L=!1,A=new p(e),V=new h(e);T.subscribe(v),P.subscribe(g),i.on("caps:sitemapnode:saved",function(e){x(e)&&c.fetchSiteMapNode(e.Id())}),i.on("caps:publication:created",m),i.on("caps:publication:refreshed",m);var O=$(window);e.on("module:compositionComplete",function(e,t){t===U&&(O.trigger("forceViewportHeight:refresh"),V.activate())});var U={website:M,siteMapVersions:t.computed(function(){var e=M()?M().sortedSiteMapVersions():[];return t.utils.arrayMap(e,k)}),selectedSiteMap:T,selectedNode:P,selectedPublication:E,properties:R,listScrollState:V,teasers:t.computed(function(){if(!P())return[];var e=t.utils.arrayFilter(P().childNodes(),function(e){return e.isTeaser()});return t.utils.arrayMap(e,function(e){return new I(e)})}),activate:function(e){L||(L=!0,e&&e.p||D()),e&&e.p&&S(e.p),A.activate()},shouldActivate:function(){return!0},deactivate:function(){A.deactivate(),V.deactivate()},createSiteMapVersion:function(){c.createNewSiteMapVersion(M()).then(w).fail(C)},deleteSiteMapVersion:function(){var e="Sitemap-Version verwerfen",t="Abbrechen",n=T().entity();n&&i.showMessage("Soll diese Version wirklich verworfen werden?","Sitemap-Version verwerfen?",[e,t]).then(function(t){if(t===e){var r=n.nextVersion()||n.previousVersion();w(r),c.deleteSiteMapVersion(n).fail(C)}})},publishSiteMapVersion:function(){c.publishSiteMap(T().entity(),u.user().userName())},createSiteMapNode:function(){T()&&P()&&c.createSiteMapNode(T().entity(),P()).then(function(e){T().refreshTree(),T().selectNodeByKey(e.Id())}).fail(C)},deleteSiteMapNode:function(){var e="Seite löschen",t="Abbrechen";i.showMessage('Soll die Seite "'+P().localeTitle("de")+'" wirklich gelöscht werden?',"Seite löschen",[e,t]).then(function(t){t===e&&N(P())})},editWebsite:function(){n.navigate("#website")},moveSelectedNodeUp:function(){P()&&(P().moveUp(),c.saveChanges().then(function(){T()&&T().refreshTree()}))},moveSelectedNodeDown:function(){P()&&(P().moveDown(),c.saveChanges().then(function(){T()&&T().refreshTree()}))},moveSelectedNode:function(){function t(e){return!e.isTeaser()&&e.Id()!==P().Id()}if(T()){var n=T(),r=P();i.selectSiteMapNode({module:e,nodeFilter:t,siteMapId:n.entity().Id(),canSelectSiteMap:!1}).then(function(e){e.dialogResult&&e.selectedNode&&e.selectedNode.Id()!==r.ParentNodeId()&&(r.reparent(e.selectedNode),c.saveChanges().then(function(){n.refreshTree(),n.tree().selectedNode().ensureVisible()}))})}}};return A.keydown=function(e){T()&&T().tree()&&T().tree().handleKeyDown(e)},U});
define('modules/sitemap/viewmodels/siteMapNodeSelectionDialog',["plugins/dialog","ko","entityManagerProvider","breeze","./siteMapViewModel","durandal/system"],function(e,t,n,r,i,a){function o(e){var r=this,o=n.createManager();r.manager=o,r.website=t.observable(),r.selectedSiteMap=t.observable(),r.selectedNode=t.observable(),r.okTitle=t.observable(e.okTitle||"Weiter"),r.siteMapSelectionEnabled=t.observable(e.canSelectSiteMap!==!1),r.isNodeEnabled=function(t){return e.nodeFilter&&a.isFunction(e.nodeFilter)?e.nodeFilter.call(r,t):!0},e=e||{},r.selectedSiteMap.subscribe(function(e){function t(e){var t=new l("SiteMapNodes").where("SiteMapId","==",e).expand("Resources");return r.manager.executeQuery(t)}r.selectedNode(null),e&&(s=e.entity().Id(),t(e.entity().Id()).then(function(){e.buildTree(),e.entity().rootNodes().length&&e.selectNodeByKey(e.entity().rootNodes()[0].Id())}))}),r.siteMaps=t.computed(function(){var e=r.website()?r.website().sortedSiteMapVersions():[];return t.utils.arrayMap(e,function(e){var t=new i(e,o);return t.selectedNodeChanged=function(e){e&&r.selectedNode(e.entity())},t})}),r.findSiteMap=function(e){return t.utils.arrayFirst(r.siteMaps(),function(t){return t.entity()===e})}}var s,l=r.EntityQuery;return o.prototype.activate=function(){this.fetchSiteMapVersions()},o.prototype.fetchSiteMapVersions=function(){var e=this,n=(new l).from("Websites").expand("SiteMapVersions");return e.manager.executeQuery(n).then(function(n){e.website(n.results[0]);var r;s&&(r=t.utils.arrayFirst(e.website().SiteMapVersions(),function(e){return e.Id()===s})),e.selectedSiteMap(e.findSiteMap(r||e.website().latestSiteMap()))})},o.prototype.selectOk=function(){this.selectedNode()&&e.close(this,{dialogResult:!0,selectedNode:this.selectedNode()})},o.prototype.selectCancel=function(){e.close(this,{dialogResult:!1})},o.install=function(){require(["plugins/siteMapNodeSelection"],function(e){e.registerDialog(o)})},o});
define('modules/sitemap/viewmodels/translator',["../module","ko","localization","entityManagerProvider","breeze"],function(e,t,n,r,i){function a(){function i(e){var t=(new o).from("SiteMapNodes").where("Id","==",e).expand("Resources");return s.executeQuery(t)}var a=this,s=r.createManager();a.language=t.observable(),a.entity=t.observable(),a.original=t.observable(),a.translation=t.observable(),a.activate=function(e,t){a.language(new n.Language(t)),i(e).then(function(e){if(e.results.length){var n=e.results[0];a.entity(n),a.original(n.getOrCreateResource("de",s)),a.translation(n.getOrCreateResource(t,s))}})},a.navigateBack=function(){a.entity()&&e.router.navigate("#sitemap/edit/"+a.entity().Id())},a.showDraftsIndex=function(){e.router.navigate(e.routeConfig.hash)},a.saveChanges=function(){s.saveChanges().then(a.showDraftsIndex)}}var o=i.EntityQuery;return a});
define('text!modules/sitemap/views/editor.html',[],function () { return '<div id="sitemapnode-translator" class="app-page bottom-fixed-navbar-container">\r\n\r\n    <div class="panel-padding-h">\r\n        <div class="row" data-bind="if: entity()">\r\n            <div class="col-md-6">\r\n                <div class="form-group row">\r\n                    <div class="col-md-6">\r\n                        <label>Name</label>\r\n                        <input type="text" data-bind="value: entity().Name" class="form-control" />\r\n                    </div>\r\n                    <div class="col-md-6">\r\n                        <label>Permanente Id</label>\r\n                        <input type="text" data-bind="value: entity().PermanentId" class="form-control" />\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label>Titel (Deutsch)</label>\r\n                    <input type="text" data-bind="value: entity().getResource(\'de\').Title" class="form-control" />\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label>Beschreibung (Deutsch)</label>\r\n                    <textarea data-bind="value: entity().getResource(\'de\').Description" class="form-control" rows="5" />\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label>Stichworte (Deutsch)</label>\r\n                    <textarea data-bind="value: entity().getResource(\'de\').Keywords" class="form-control" rows="5" />\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="col-md-12">\r\n                        <h5>Übersetzungen</h5>\r\n                        <ul data-bind="foreach: supportedTranslations" class="list-inline">\r\n                            <li>\r\n                                <a href="#" data-bind="click: $parent.editTranslation"><i class="fa fa-edit"></i> <!-- ko text: localeName(\'de\') --><!-- /ko --></a>\r\n                            </li>\r\n                        </ul>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n            <div class="col-md-6">\r\n                <div class="form-group">\r\n                    <label>Seitentyp</label>\r\n                    <select class="form-control" data-bind="options: nodeTypes, optionsCaption: \'Bitte wählen...\', optionsText: \'title\', value: nodeType, disable: nodeType() && nodeType().isRoot"></select>\r\n                </div>\r\n\r\n                <div class="form-group" data-bind="if: nodeType() && nodeType().isCustomType">\r\n                    <label>Benutzerdefinierter Typ</label>\r\n                    <input type="text" data-bind="value: entity().NodeType" class="form-control" />\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label>Url</label>\r\n                    <input type="text" data-bind="value: entity().ActionUrl" class="form-control" />\r\n                </div>\r\n\r\n                <div class="form-group row">\r\n                    <div class="col-md-6">\r\n                        <label>Weiterleitung</label>\r\n                        <input type="text" data-bind="value: entity().Redirect" class="form-control" />\r\n                    </div>\r\n\r\n                    <div class="col-md-6">\r\n                        <label>Weiterleitungstyp</label>\r\n                        <input type="text" data-bind="value: entity().RedirectType" class="form-control" />\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: navigateBack"><span><i class="fa fa-arrow-left"></i> Zurück</span></a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: saveChanges"><span><i class="fa fa-save"></i> Speichern</span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n\r\n</div>\r\n';});

define('text!modules/sitemap/views/index.html',[],function () { return '<div id="sitemap-index" class="app-page bottom-fixed-navbar-container">\r\n\r\n    <div class="panel-padding-h subnav-fixed-top-container">\r\n        <div class="row subnav-fixed-top sitemap-index-header">\r\n            <div class="col-md-12">\r\n                <ul class="list-inline pull-left">\r\n                    <li>\r\n                        <a href="#" data-bind="click: editWebsite"><i class="fa fa-cog"></i> Website</a>\r\n                    </li>\r\n                    <li>\r\n                        <!-- ko if: siteMapVersions() -->\r\n                        <select data-bind="options: siteMapVersions, optionsCaption: \'Version wählen\', optionsText: \'title\', value: selectedSiteMap"></select>\r\n                        <!-- /ko -->\r\n                    </li>\r\n                    <li>\r\n                        <a href="#" data-bind="click: createSiteMapVersion"><i class="fa fa-plus"></i> Neue Version</a>\r\n                    </li>\r\n                    <li data-bind="if: selectedSiteMap()">\r\n                        <a href="#" data-bind="click: deleteSiteMapVersion"><i class="fa fa-trash-o"></i> Version verwerfen</a>\r\n                    </li>\r\n                </ul>\r\n\r\n                <div class="pull-left">\r\n                    <!-- ko if: selectedSiteMap() -->\r\n                    <span data-bind="visible: !selectedSiteMap().entity().PublishedFrom()">\r\n                        Nicht veröffentlicht <a href="#" data-bind="click: publishSiteMapVersion"><i class="fa fa-share-square-o"></i> Jetzt veröffentlichen</a>\r\n                    </span>\r\n                    <span data-bind="visible: selectedSiteMap().entity().PublishedFrom()">\r\n                        Veröffentlicht <span data-bind="text: selectedSiteMap().publishedFromNow()"></span>\r\n                    </span>\r\n                    <!-- /ko -->\r\n                </div>\r\n            </div>\r\n        </div>\r\n        <div class="row">\r\n            <div class="col-md-3 col-lg-2 fixed-sidebar left-fixed-sidebar sitemap-index-sidebar">\r\n                <div data-bind="forceViewportHeight: { minWidth: 992 }, scrollTop: { observable: listScrollState.scrollTop, enabled: listScrollState.isEnabled }" class="panel-scroll-vh">\r\n                    <!-- ko if: selectedSiteMap() && selectedSiteMap().tree() -->\r\n                    <!-- ko template: { name: \'NodesTemplate\', data: selectedSiteMap().tree().rootNodes() } --><!-- /ko -->\r\n                    <!-- /ko -->\r\n                </div>\r\n            </div>\r\n\r\n            <div class="col-md-offset-3 col-lg-offset-2 col-md-6 col-lg-8">\r\n                <!-- ko if: selectedNode() && teasers() && teasers().length -->\r\n                <h5>Aufmacher (<!-- ko text: teasers().length --><!-- /ko -->)</h5>\r\n                <ul class="list-unstyled list-icons" data-bind="foreach: teasers">\r\n                    <li data-bind="click: selectTeaser, css: { \'selected\': isSelected() }">\r\n                        <div class="list-icons-tile">\r\n                            <i class="fa fa-star fa-4x"></i>\r\n                        </div>\r\n                        <div class="list-icons-label">\r\n                            <!-- ko text: entity.localeTitle(\'de\') --><!-- /ko -->\r\n                        </div>\r\n                    </li>\r\n                </ul>\r\n                <!-- /ko -->\r\n                <!-- ko if: selectedPublication() -->\r\n                <section class="draft-preview-content sitemap-index">\r\n                    <!-- ko with: selectedPublication() -->\r\n                    <!-- ko if: template() -->\r\n                    <!-- ko foreach: { data: template().rows, as: \'row\' } -->\r\n                    <div class="row">\r\n                        <!-- ko foreach: { data:row.cells, as: \'cell\' } -->\r\n                        <div data-bind="draftTemplateClass: cell">\r\n                            <div class="template-preview-cell" data-bind="html: $parents[1].findContentPart(cell)"></div>\r\n                        </div>\r\n                        <!-- /ko -->\r\n                    </div>\r\n                    <!-- /ko -->\r\n                    <!-- /ko -->\r\n                    <!-- /ko -->\r\n                </section>\r\n                <!-- /ko -->\r\n                <!-- ko if: selectedPublication() && selectedPublication().files().length -->\r\n                <div data-bind="with: selectedPublication()">\r\n                    <h5>Dateien (<!-- ko text: files().length --><!-- /ko -->)</h5>\r\n                    <ul class="list-inline" data-bind="foreach: files()">\r\n                        <li data-bind="if: getResource(\'de\') && getResource(\'de\').FileVersion() && getResource(\'de\').FileVersion().File()">\r\n                            <i class="fa fa-file"></i> <!-- ko text: getResource(\'de\').FileVersion().File().FileName --><!-- /ko -->\r\n                        </li>\r\n                    </ul>\r\n                </div>\r\n                <!-- /ko -->\r\n            </div>\r\n\r\n            <div class="col-md-3 col-lg-2 fixed-sidebar right-fixed-sidebar sitemap-index-sidebar" data-bind="if: properties()">\r\n                <h5 data-bind="text: properties().entity.localeTitle(\'de\')"></h5>\r\n                <!-- ko with: properties() -->\r\n                <!-- ko if: entity.canHaveContent() -->\r\n                <ul class="list-unstyled">\r\n                    <!-- ko if: hasContent -->\r\n                    <li>\r\n                        <a href="#" data-bind="click: editContent"><i class="fa fa-edit fa-fw"></i> <span data-bind="attr: { title: contentSummary() + \' \' + authorSummary() }">Inhalt bearbeiten</span></a>\r\n                    </li>\r\n                    <!-- /ko -->\r\n                    <li>\r\n                        <a href="#" data-bind="click: selectContent"><i class="fa fa-arrow-right fa-fw"></i> Inhalt festlegen...</a>\r\n                    </li>\r\n                </ul>\r\n                <!-- /ko -->\r\n                <!-- /ko -->\r\n                <!-- ko if: selectedPublication() && selectedNode() && selectedNode().canLinkTo() -->\r\n                <div>\r\n                    <h5>Adresse</h5>\r\n                    <p>\r\n                        <span>caps://publication/<!-- ko text: selectedNode().PermanentId() --><!-- /ko --></span>\r\n                    </p>\r\n                </div>\r\n                <!-- /ko -->\r\n                <ul class="list-unstyled">\r\n                    <li>\r\n                        <a href="#" data-bind="click: properties().edit"><i class="fa fa-edit fa-fw"></i> Eigenschaften</a>\r\n                    </li>\r\n                </ul>\r\n                <!-- ko with: properties() -->\r\n                <!-- ko if: hasOptions -->\r\n                <h5>Optionen</h5>\r\n                <ul class="list-unstyled">\r\n                    <!-- ko if: canCreateTeaser() -->\r\n                    <li>\r\n                        <a href="#" data-bind="click: createTeaser"><i class="fa fa-arrow-right fa-fw"></i> Auf Startseite platzieren</a>\r\n                    </li>\r\n                    <!-- /ko -->\r\n                    <!-- ko if: entity.isTeaser() -->\r\n                    <li>\r\n                        <a href="#" data-bind="click: deleteTeaser"><i class="fa fa-trash-o fa-fw"></i> Aufmacher löschen</a>\r\n                    </li>\r\n                    <!-- /ko -->\r\n                </ul>\r\n                <!-- /ko -->\r\n                <!-- /ko -->\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li data-bind="if: selectedNode()">\r\n                    <a href="#" data-bind="click: createSiteMapNode"><span><i class="fa fa-plus fa-fw"></i> Neue Seite</span></a>\r\n                </li>\r\n                <li data-bind="if: selectedNode()">\r\n                    <a href="#" data-bind="click: moveSelectedNode"><span><i class="fa fa-arrows fa-fw"></i> Seite verschieben</span></a>\r\n                </li>\r\n                <li data-bind="if: selectedNode()">\r\n                    <a href="#" data-bind="click: moveSelectedNodeUp" title="Nach oben"><span><i class="fa fa-arrow-up fa-fw"></i></span></a>\r\n                </li>\r\n                <li data-bind="if: selectedNode()">\r\n                    <a href="#" data-bind="click: moveSelectedNodeDown" title="Nach unten"><span><i class="fa fa-arrow-down fa-fw"></i></span></a>\r\n                </li>\r\n                <li data-bind="if: selectedNode()">\r\n                    <a href="#" data-bind="click: deleteSiteMapNode"><span><i class="fa fa-trash-o fa-fw"></i> Seite löschen</span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n<script type="text/html" id="NodesTemplate">\r\n    <ul data-bind="foreach: $data" class="list-unstyled tree-branch">\r\n        <!-- ko if: !(entity() && entity().NodeType().toLowerCase() === \'teaser\') -->\r\n        <li data-bind="if: !entity().entityAspect.entityState.isDeleted()">\r\n            <div class="tree-node" data-bind="css: { \'tree-node-selected\': isSelected }, scrollIntoViewTrigger: { source: scrollIntoViewRequest }">\r\n                <div class="tree-node-toggle pull-left">\r\n                    <a href="#" data-bind="click: toggleIsExpanded">\r\n                        <i class="fa fa-fw" data-bind="css: { \'fa-plus\': !isExpanded() && hasChildNodes(), \'fa-minus\': isExpanded() && hasChildNodes() }"></i>\r\n                    </a>\r\n                </div>\r\n                <div class="tree-node-label" data-bind="click: selectNode">\r\n                    <i class="fa fa-file-text fa-fw"></i> <span data-bind="text: entity().localeTitle(\'de\')"></span>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- ko if: isExpanded() && hasChildNodes() -->\r\n            <!-- ko template: { name: \'NodesTemplate\', data: childNodes() } --><!-- /ko -->\r\n            <!-- /ko -->\r\n        </li>\r\n        <!-- /ko -->\r\n    </ul>\r\n</script>\r\n';});

define('text!modules/sitemap/views/siteMapNodeSelectionDialog.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n    <div class="panel-padding-h">\r\n        <div class="row">\r\n            <div class="col-md-12">\r\n                <h1>Seite wählen</h1>\r\n                <form class="form-inline" role="form">\r\n                    <!-- ko if: website() -->\r\n                    <div class="form-group">\r\n                        <label for="siteMapVersion" class="control-label">Sitemap</label>\r\n                        <select id="siteMapVersion" data-bind="options: siteMaps, optionsText: \'title\', optionsCaption: \'Version wählen...\', value: selectedSiteMap, enable: siteMapSelectionEnabled" class="form-control" style="width:auto"></select>\r\n                    </div>\r\n                    <!-- /ko -->\r\n                </form>\r\n            </div>\r\n        </div>\r\n\r\n        <div class="row">\r\n            <div class="col-md-12">\r\n                <div class="panel-padding-v">\r\n                    <!-- ko if: selectedSiteMap() && selectedSiteMap().tree() -->\r\n                    <!-- ko template: { name: \'NodesTemplate2\', data: selectedSiteMap().tree().rootNodes() } --><!-- /ko -->\r\n                    <!-- /ko -->\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: selectCancel"><span><i class="fa fa-arrow-left fa-fw"></i> Abbrechen</span></a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: selectOk"><span><i class="fa fa-save fa-fw"></i> <!-- ko text: okTitle --><!-- /ko --></span></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n\r\n<script type="text/html" id="NodesTemplate2">\r\n    <ul data-bind="foreach: $data" class="list-unstyled tree-branch">\r\n        <li data-bind="if: $root.isNodeEnabled(entity()) && !entity().entityAspect.entityState.isDeleted()">\r\n            <div class="tree-node" data-bind="css: { \'tree-node-selected\': isSelected }">\r\n                <div class="tree-node-toggle pull-left">\r\n                    <a href="#" data-bind="click: toggleIsExpanded">\r\n                        <i class="fa fa-fw" data-bind="css: { \'fa-plus\': !isExpanded() && hasChildNodes(), \'fa-minus\': isExpanded() && hasChildNodes() }"></i>\r\n                    </a>\r\n                </div>\r\n                <div class="tree-node-label" data-bind="click: selectNode">\r\n                    <i class="fa fa-file-text fa-fw"></i> <span data-bind="text: entity().getResource(\'de\').Title"></span>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- ko if: isExpanded() && hasChildNodes() -->\r\n            <!-- ko template: { name: \'NodesTemplate2\', data: childNodes() } --><!-- /ko -->\r\n            <!-- /ko -->\r\n        </li>\r\n    </ul>\r\n</script>';});

define('text!modules/sitemap/views/siteMapTree.html',[],function () { return '\r\n<div>\r\n    <div class="space-tb">\r\n        <form class="form-inline" role="form">\r\n            <!-- ko if: website() -->\r\n            <div class="form-group">\r\n                <label for="siteMapVersion" class="control-label">Sitemap</label>\r\n                <select id="siteMapVersion" data-bind="options: siteMaps, optionsText: \'title\', optionsCaption: \'Version wählen...\', value: selectedSiteMap, enable: siteMapSelectionEnabled" class="form-control" style="width:auto"></select>\r\n            </div>\r\n            <!-- /ko -->\r\n        </form>\r\n    </div>\r\n    <div data-bind="if: selectedSiteMap() && selectedSiteMap().tree()" class="space-tb tree">\r\n        <!-- ko template: { name: \'siteMapTreeNodeTemplate\', data: selectedSiteMap().tree().rootNodes() } --><!-- /ko -->\r\n    </div>\r\n</div>\r\n\r\n<script type="text/html" id="siteMapTreeNodeTemplate">\r\n    <ul data-bind="foreach: $data" class="list-unstyled tree-branch">\r\n        <li data-bind="if: $root.isNodeEnabled(entity()) && !entity().entityAspect.entityState.isDeleted()">\r\n            <div class="tree-node" data-bind="css: { \'tree-node-selected\': isSelected }">\r\n                <div class="tree-node-toggle pull-left">\r\n                    <a href="#" data-bind="click: toggleIsExpanded">\r\n                        <i class="fa fa-fw" data-bind="css: { \'fa-plus\': !isExpanded() && hasChildNodes(), \'fa-minus\': isExpanded() && hasChildNodes() }"></i>\r\n                    </a>\r\n                </div>\r\n                <div class="tree-node-label" data-bind="click: selectNode">\r\n                    <i class="fa fa-file-text fa-fw"></i> <span data-bind="text: entity().getResource(\'de\').Title"></span>\r\n                </div>\r\n            </div>\r\n\r\n            <!-- ko if: isExpanded() && hasChildNodes() -->\r\n            <!-- ko template: { name: \'siteMapTreeNodeTemplate\', data: childNodes() } --><!-- /ko -->\r\n            <!-- /ko -->\r\n        </li>\r\n    </ul>\r\n</script>';});

define('text!modules/sitemap/views/translator.html',[],function () { return '<div id="sitemapnode-translator" class="app-page bottom-fixed-navbar-container">\r\n\r\n    <div class="panel-padding-h">\r\n\r\n        <div class="row">\r\n            <div class="col-md-5 col-md-offset-2">\r\n                <p>Original (Deutsch)</p>\r\n            </div>\r\n            <div class="col-md-5">\r\n                <p>Übersetzung (<!-- ko text:language().localeName(\'de\') --><!-- /ko -->)</p>\r\n            </div>\r\n        </div>\r\n\r\n        <!-- ko if: original() && translation() -->\r\n\r\n        <div class="row form-group">\r\n            <div class="col-md-2">\r\n                <label class="control-label">Titel</label>\r\n            </div>\r\n            <div class="col-md-5">\r\n                <input type="text" data-bind="value: original().Title" class="form-control" disabled="disabled" />\r\n            </div>\r\n            <div class="col-md-5">\r\n                <input type="text" data-bind="value: translation().Title, attr: { lang: language().culture }" class="form-control" />\r\n            </div>\r\n        </div>\r\n\r\n        <div class="row form-group">\r\n            <div class="col-md-2">\r\n                <label class="control-label">Beschreibung</label>\r\n            </div>\r\n            <div class="col-md-5">\r\n                <textarea data-bind="value: original().Description" class="form-control" disabled="disabled" rows="4" />\r\n            </div>\r\n            <div class="col-md-5">\r\n                <textarea data-bind="value: translation().Description, attr: { lang: language().culture }" class="form-control" rows="4" />\r\n            </div>\r\n        </div>\r\n\r\n        <div class="row form-group">\r\n            <div class="col-md-2">\r\n                <label class="control-label">Stichworte</label>\r\n            </div>\r\n            <div class="col-md-5">\r\n                <textarea data-bind="value: original().Keywords" class="form-control" disabled="disabled" rows="4" />\r\n            </div>\r\n            <div class="col-md-5">\r\n                <textarea data-bind="value: translation().Keywords, attr: { lang: language().culture }" class="form-control" rows="4" />\r\n            </div>\r\n        </div>\r\n\r\n        <!-- /ko -->\r\n\r\n        <div class="navbar navbar-default navbar-fixed-bottom">\r\n            <div class="navbar-panel pull-left">\r\n                <ul class="nav navbar-nav">\r\n                    <li>\r\n                        <a href="#" data-bind="click: navigateBack"><span><i class="fa fa-arrow-left"></i> Zurück</span></a>\r\n                    </li>\r\n                    <li>\r\n                        <a href="#" data-bind="click: saveChanges"><span><i class="fa fa-save"></i> Speichern</span></a>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n</div>\r\n';});

define('modules/user/entities',["require","ko","moment","authentication"],function(e,t,n,r){function i(e){var i=this;e=e||{},this.userName=t.observable(e.userName||"").extend({required:!0}),this.password=t.observable(e.password||""),this.comment=t.observable(e.comment||""),this.creationDate=t.observable(e.creationDate||new Date),this.email=t.observable(e.email||"").extend({required:!0,email:!0}),this.phone=t.observable(e.phone||""),this.isApproved=t.observable(e.isApproved||!1),this.isLockedOut=t.observable(e.isLockedOut||!1),this.lastActivityDate=t.observable(e.lastActivityDate),this.lastLockoutDate=t.observable(e.lastLockoutDate),this.lastLoginDate=t.observable(e.lastLoginDate),this.lastPasswordChangedDate=t.observable(e.lastPasswordChangedDate),this.firstName=t.observable(e.firstName||"").extend({required:!0}),this.lastName=t.observable(e.lastName||"").extend({required:!0}),this.roles=t.observableArray(e.roles||[]),this.isOnline=t.computed(function(){return i.lastActivityDate()?n()<=n(i.lastActivityDate()).add("minutes",15):!1}),this.creationDateFormatted=t.computed(function(){return n(i.creationDate()).fromNow()}),this.hasEverLoggedIn=t.computed(function(){return i.lastLoginDate()>i.creationDate()}),this.lastLoginDateFormatted=t.computed(function(){return i.hasEverLoggedIn()?n(i.lastLoginDate()).fromNow():"noch nie"}),this.lastActivityDateFormatted=t.computed(function(){return i.lastActivityDate()<i.creationDate()?"noch nie":n(i.lastActivityDate()).subtract("seconds",20).fromNow()}),this.hasEverBeenLockedOut=t.computed(function(){return i.lastLockoutDate()>i.creationDate()}),this.lastLockoutDateFormatted=t.computed(function(){return i.hasEverBeenLockedOut()?n(i.lastLockoutDate()).fromNow():"noch nie"}),this.hasEverChangedPassword=t.computed(function(){return i.lastPasswordChangedDate()>i.creationDate()}),this.lastPasswordChangedDateFormatted=t.computed(function(){return i.hasEverChangedPassword()?n(i.lastPasswordChangedDate()).fromNow():"noch nie"}),this.isEffectivelyLockedOut=t.computed(function(){if(i.isLockedOut()){var e=n(i.lastLockoutDate()).add("minutes",r.metadata.lockoutPeriod);return e>new Date}return!1}),this.displayName=t.computed(function(){return i.firstName().length>0?i.firstName():i.lastName().length>0?i.lastName():i.userName()}),this.fullName=t.computed(function(){var e="{0} {1}".replace(/\{0\}/,i.firstName()).replace(/\{1\}/,i.lastName()).trim();return e.length?e:i.userName()}),this.hasPhone=t.computed(function(){return i.phone().length>0}),t.validation.group(this)}return i.prototype.refresh=function(e){e=e||{},this.comment(e.comment||""),this.creationDate(e.creationDate||new Date),this.email(e.email||""),this.isApproved(e.isApproved||!1),this.isLockedOut(e.isLockedOut||!1),this.lastActivityDate(e.lastActivityDate),this.lastLockoutDate(e.lastLockoutDate),this.lastLoginDate(e.lastLoginDate),this.lastPasswordChangedDate(e.lastPasswordChangedDate),this.firstName(e.firstName||""),this.lastName(e.lastName||"")},i.prototype.toDto=function(){var e={userName:this.userName(),password:this.password(),comment:this.comment(),email:this.email(),roles:this.roles(),firstName:this.firstName(),lastName:this.lastName(),phone:this.phone()};return e},i.prototype.isInRole=function(e){if(!e||!e.length)throw Error("The role parameter must not be null or empty");if(this.roles()&&this.roles().length)for(var t=0;t<this.roles().length;t++)if(e==this.roles()[t])return!0;return!1},i.prototype.addToRole=function(e){this.isInRole(e)||this.roles.push(e)},i.prototype.removeFromRole=function(e){this.isInRole(e)&&this.roles.remove(e)},i.prototype.toggleRole=function(e){this.isInRole(e)?this.removeFromRole(e):this.addToRole(e)},{User:i}});
define('modules/user/datacontext',["Q","knockout","jquery","modules/user/entities"],function(e,t,n,r){function i(){return d("~/api/usermgmt/GetAllUsers").then(function(e){return n.map(e,function(e){return new r.User(e)})}).fail(function(e){alert(e.message)})}function a(){return d("~/api/usermgmt/GetAllRoles")}function o(e){return d("~/api/usermgmt/GetUser/",{method:"get",data:{userName:e}}).then(function(e){return new r.User(e)})}function s(e){return d("~/api/usermgmt/CreateUser",{method:"post",data:e.toDto()})}function l(e){return d("~/api/usermgmt/UpdateUser",{method:"post",data:e.toDto()})}function u(e){return d("~/api/usermgmt/DeleteUser",{method:"post",data:e.toDto()}).then(function(){return e})}function c(e,t,n){return d("~/api/usermgmt/SetPassword",{method:"post",data:{UserName:e,NewPassword:t,ConfirmPassword:n}})}function d(t,r){var i=e.defer();return n.ajax(t,r).done(i.resolve).fail(i.reject),i.promise}return{getAllUsers:i,getAllRoles:a,getUser:o,createUser:s,updateUser:l,deleteUser:u,setPassword:c}});
define('modules/user/viewmodels/deleteUserConfirmationDialog',["plugins/dialog","knockout"],function(e,t){var n=function(e){this.userName=t.observable(e||"")};return n.prototype.ok=function(){e.close(this,"Löschen")},n.prototype.cancel=function(){e.close(this,"Abbrechen")},n.show=function(t){return e.show(new n(t))},n});
define('modules/user/commands/deleteUser',["durandal/app","authentication","../datacontext","Q","../viewmodels/deleteUserConfirmationDialog"],function(e,t,n,r,i){function a(a){function o(t){e.trigger("caps:user:deleted",t),l.resolve()}function s(){e.showMessage("Die Aktion konnte nicht ausgeführt werden.","Benutzer löschen"),l.reject()}var l=r.defer();return a.userName()===t.user().userName()?(e.showMessage("Du kannst Dich nicht selbst löschen. Verwende einen anderen Benutzer, um diesen Benutzer zu löschen.","Nicht erlaubt").then(l.reject),l.promise):(i.show(a.userName()).then(function(e){"Löschen"===e&&n.deleteUser(a).then(o).fail(s)}),l.promise)}return{execute:a}});
define('text!modules/user/module.html',[],function () { return '<div id="userModule">\r\n    <!--ko router: { transition:\'entrance\', cacheViews:true }--><!--/ko-->\r\n</div>';});

define('modules/user/module',["infrastructure/moduleFactory","infrastructure/moduleRouter"],function(e,t){var n=e.createModule({route:"users*details",moduleId:"modules/user/module",title:"Benutzer",nav:40,hash:"#users",roles:["Administrator"]});return n.initializeRouter=function(){n.router=t.createModuleRouter(n,"modules/user","users").map([{route:"",moduleId:"viewmodels/dashboard",title:"Benutzerverwaltung",nav:!1},{route:"detail/:userName",moduleId:"viewmodels/userDetail",title:"Benutzerdetails",nav:!1},{route:"edit/:userName",moduleId:"viewmodels/userEditor",title:"Benutzer bearbeiten",nav:!1},{route:"add",moduleId:"viewmodels/userEditor",title:"Benutzer hinzufügen",nav:!1}]).buildNavigationModel()},n});
define('modules/user/viewmodels/dashboard',["infrastructure/utils","durandal/app","durandal/system","knockout","moment","authentication","../datacontext","../module","../commands/deleteUser"],function(e,t,n,r,i,a,o,s,l){function u(){h(!0),o.getAllUsers().then(function(e){f.removeAll(),r.utils.arrayForEach(e,function(e){f.push(e)})}).fail(function(e){n.log("Error loading Users: "+e.message),t.showMessage("Die Benutzer-Daten konnten nicht geladen werden.")}).done(function(){h(!1)})}function c(){s.router.navigate("#users/add")}function d(e){return r.utils.arrayFirst(f(),function(t){return t.userName()===e})}var f=r.observableArray(),p=!1,h=r.observable(!1);return t.on("caps:user:created",function(){u()}),t.on("caps:user:deleted",function(e){if(e&&e.userName){var t=d(e.userName());f.remove(t)}}),t.on("caps:user:updated",function(e){var t=d(e.UserName);t&&t.refresh(e)}),t.on("caps:authentication:loggedOff",function(){f.removeAll(),p=!1}),{users:f,moment:i,addUser:c,deleteUser:l.execute,refresh:u,isLoading:h,activate:function(){p||(p=!0,u())},shouldActivate:function(t,n,r){return p?e.compareArrays(n,r):!0}}});
define('modules/user/viewmodels/setPasswordDialog',["plugins/dialog","knockout","authentication"],function(e,t,n){var r=function(){var e=this;e.newPassword=t.observable("").extend({required:!0,minLength:6}),e.confirmPassword=t.observable("").extend({equal:e.newPassword}),t.validation.group(this),this.minRequiredPasswordLength=n.metadata.minRequiredPasswordLength};return r.prototype.ok=function(){this.isValid()&&e.close(this,{newPassword:this.newPassword(),confirmPassword:this.confirmPassword()})},r.prototype.cancel=function(){e.close(this,null)},r.show=function(){return e.show(new r)},r});
define('modules/user/viewmodels/userDetail',["../datacontext","../entities","knockout","Q","modules/user/module","../commands/deleteUser","durandal/app","moment","./setPasswordDialog","authentication","toastr","infrastructure/screen"],function(e,t,n,r,i,a,o,s,l,u,c,d){function f(){var n=r.defer();return g.userName()&&0!==g.userName().length?(g.isLoading(!0),e.getUser(g.userName()).then(function(e){g.user(e),n.resolve()}).fail(function(){o.showMessage("Die Benutzerdaten konnten nicht geladen werden.","Nicht geladen").then(n.reject)}).done(function(){g.isLoading(!1)})):(g.user(new t.User),n.resolve()),n.promise}function p(){i.router.navigate("#users/edit/"+g.userName())}function h(){l.show().then(function(e){e&&m(e.newPassword,e.confirmPassword)})}function m(t,n){e.setPassword(g.userName(),t,n).then(f).then(function(){c.success("Das Passwort wurde erfolgreich geändert.","Passwort geändert",{positionClass:d.isPhone()?"toast-bottom-full-width":"toast-bottom-right"})}).fail(function(){o.showMessage("Das Passwort konnte nicht festgelegt werden. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin auftritt.","Nicht erfolgreich")})}function v(){i.router.navigate(i.routeConfig.hash)}var g={user:n.observable(),userName:n.observable(),isLoading:n.observable(!1),activate:function(e){return this.userName(e),f()},editUser:p,changePassword:h,deleteUser:function(){a.execute(this.user()).then(v)},refresh:f,navigateBack:v,moment:s,authentication:u};return g});
define('modules/user/viewmodels/userEditor',["modules/user/module","../entities","../datacontext","knockout","Q"],function(e,t,n,r,i){function a(e){return n.getUser(e).then(o).fail(h)}function o(e){return d().then(function(){f(y(),e),k.user(e),k.user.markClean()})}function s(){var e=i.defer();if(k.user().errors().length>0)return v.showMessage("Die Änderungen können noch nicht gespeichert werden. Kontrolliere die markierten Eingabefelder.","Eingaben unvollständig").then(function(){return e.reject(),e.promise});var t=k.isNewUser()?l:u;return t.call(k).then(function(){k.user.markClean(),e.resolve()}).fail(function(t){e.reject(t)}).done(),e.promise}function l(){return n.createUser(this.user()).then(function(e){v.trigger("caps:user:created",e)}).fail(h)}function u(){return n.updateUser(this.user()).then(function(e){v.trigger("caps:user:updated",e)}).fail(h)}function c(){k.roles.removeAll(),k.user(new t.User),k.user.markClean()}function d(){return n.getAllRoles().then(function(e){y(e)})}function f(e,t){var n=r.utils.arrayMap(e,function(e){return new N(e,t)});t.userName()==b.user().userName()&&p(n,"Administrator"),w(n)}function p(e,t){var n=r.utils.arrayFirst(e,function(e){return e.role()==t});n&&n.isEnabled(!1)}function h(e){throw v.showMessage("Bei der Ausführung der Aktion ist ein Fehler aufgetreten.","Fehler aufgetreten"),new Error(e)}function m(){e.router.navigateBack()}var v=require("durandal/app"),g=require("durandal/system"),b=require("authentication"),y=r.observableArray([]),w=r.observableArray([]),k={user:r.observable().extend({trackDirtyWithInitialStateOf:!1}),isNewUser:r.observable(!0),roles:w,activate:function(e){if(c(),e)return this.isNewUser(!1),a(e);this.isNewUser(!0);var n=new t.User;return n.password.extend({required:!0}),n.userName.extend({isUserNameUnique:{message:"Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen."}}),o(n)},canDeactivate:function(e){return g.log("canDeactivate editor"),k.user.isDirty()?v.showMessage("Sollen die Änderungen gespeichert werden","Änderungen speichern?",["Speichern","Verwerfen","Abbrechen"]).then(function(t){return"Speichern"===t?s().then(function(){return e}).fail(function(){return!1}):"Abbrechen"===t?!1:e}):e},deactivate:function(){g.log("deactivate editor"),k.user.markClean()},save:function(){s().then(function(){m()})},cancel:function(){m()}};k.user.isDirty.subscribe(function(t){e.routeConfig.hasUnsavedChanges(t)});var N=function(e,t){var n=this;n.role=r.observable(e),n.user=t,n.isChecked=r.observable(t&&t.isInRole?t.isInRole(e):!1),n.isEnabled=r.observable(!0),this.isChecked.subscribe(function(e){var t=n.user,r=n.role(),i=e?t.addToRole:t.removeFromRole;i.call(t,r)})};return k});
define('text!modules/user/views/dashboard.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n    \r\n    <div class="container">\r\n    <table class="table table-striped full-height">\r\n        <thead>\r\n            <tr>\r\n                <th></th>\r\n                <th>Benutzer</th>\r\n                <th class="hidden-xs">Email</th>\r\n                <th class="hidden-xs">Zuletzt aktiv</th>\r\n                <th></th>\r\n                <th></th>\r\n            </tr>\r\n        </thead>\r\n        <tbody data-bind="foreach: users">\r\n            <tr>\r\n                <td class="vertical-centered row-header-icon">\r\n                    <a data-bind="attr: { href: \'#users/detail/\' + userName() }" class="no-underline">\r\n                        <i class="fa fa-user fa-2x" data-bind="css: { \'user-online\': isOnline(), \'user-offline\': !isOnline() }, attr: { title: isOnline() ? \'Online\' : \'Offline\' }"></i>\r\n                    </a>\r\n                </td>\r\n                <td>\r\n                    <a data-bind="text: fullName, attr: { href: \'#users/detail/\' + userName(), title: userName }"></a>\r\n                    <div class="visible-xs">\r\n                        <!-- ko if: hasEverLoggedIn -->\r\n                        <span data-bind="text: lastActivityDateFormatted, attr: { title: $parent.moment(lastActivityDate()).format(\'LLLL\') }"></span> zuletzt aktiv\r\n                        <!-- /ko -->\r\n                        <!-- ko if: !hasEverLoggedIn() -->\r\n                        noch nie aktiv\r\n                        <!-- /ko -->\r\n                    </div>\r\n                </td>\r\n                <td class="hidden-xs"><span data-bind="text: email"></span></td>\r\n                <td class="hidden-xs"><span data-bind="text: lastActivityDateFormatted, textTimeout: { interval: 30000, observable: lastActivityDate }, attr: { title: $parent.moment(lastActivityDate()).format(\'LLLL\') }"></span></td>\r\n                <td class="vertical-centered">\r\n                    <a data-bind="attr: { href: \'#users/edit/\' + userName() }" title="Bearbeiten" class="no-underline"><i class="fa fa-edit fa-2x"></i></a>                     \r\n                </td>\r\n                <td class="vertical-centered">\r\n                    <a href="#" data-bind="click: $parent.deleteUser" title="Löschen" class="no-underline"><i class="fa fa-times fa-2x"></i></a>\r\n                </td>\r\n            </tr>\r\n        </tbody>\r\n    </table>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: addUser"><i class="fa fa-plus"></i> Neuer Benutzer</a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n\r\n        <div class="navbar-panel pull-right">\r\n            <div class="navbar-text">\r\n                <span data-bind="text: users().length"></span> Benutzer\r\n            </div>\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" title="Aktualisieren" data-bind="click: refresh"><i class="fa fa-refresh fa-fw" data-bind="css: { \'fa-spin\': isLoading }"></i></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!modules/user/views/deleteUserConfirmationDialog.html',[],function () { return '<div class="messageBox">\r\n    <div class="modal-header">\r\n        <h4>Benutzer löschen</h4>\r\n    </div>\r\n    <div class="modal-body">\r\n        <p class="message">Soll <strong data-bind="text: userName"></strong> wirklich gelöscht werden?</p>\r\n    </div>\r\n    <div class="modal-footer">\r\n        <button class="btn btn-primary" data-bind="click: ok">Löschen</button>\r\n        <button class="btn btn-default" data-bind="click: cancel">Abbrechen</button>\r\n    </div>\r\n</div>';});

define('text!modules/user/views/setPasswordDialog.html',[],function () { return '<div class="messageBox" id="set-password-dlg">\r\n    <div class="modal-header">\r\n        <h4>Passwort festlegen</h4>\r\n    </div>\r\n    <div class="modal-body">\r\n        <form data-bind="submit: ok">\r\n            <p class="message">Das Passwort muss mindestens <!-- ko text: minRequiredPasswordLength --><!-- /ko --> Zeichen lang sein.</p>                                \r\n            <!-- ko composeEditor: { field: newPassword, title: \'Neues Passwort\', valueUpdate: \'afterkeydown\', css: \'form-control autofocus\', type: \'password\' } --><!-- /ko -->\r\n            <!-- ko composeEditor: { field: confirmPassword, title: \'Neues Passwort bestätigen\', valueUpdate: \'afterkeydown\', css: \'form-control autofocus\', type: \'password\' } --><!-- /ko -->\r\n        </form>\r\n    </div>\r\n    <div class="modal-footer">\r\n        <button class="btn btn-primary" data-bind="click: ok">Passwort festlegen</button>\r\n        <button class="btn btn-default" data-bind="click: cancel">Abbrechen</button>\r\n    </div>\r\n</div>';});

define('text!modules/user/views/userDetail.html',[],function () { return '<div id="user-detail" class="app-page bottom-fixed-navbar-container">\r\n    \r\n    <div class="container">\r\n        <h2><span data-bind="text: user().fullName"></span> <small>Benutzerdetails</small></h2>         \r\n        <div class="alert alert-warning" data-bind="visible: user().isEffectivelyLockedOut">\r\n            <strong>Gesperrt </strong> Der Benutzer wurde <span data-bind="text: moment(user().lastLockoutDate()).fromNow(), attr: { title: moment(user().lastLockoutDate()).format(\'LLLL\') }"></span> aufgrund zu vieler ungültiger Anmelde-Versuche gesperrt.\r\n            Die Sperrung wird nach <!-- ko text: authentication.metadata.lockoutPeriod --><!-- /ko --> Minuten automatisch aufgehoben.\r\n        </div>\r\n        <div class="alert alert-info" data-bind="visible: user().isOnline">\r\n            <strong>Online </strong> <span data-bind="text: user().firstName"></span> ist derzeit online.\r\n        </div>\r\n    </div>\r\n\r\n    <div class="container">\r\n        \r\n        <div class="well well-small">\r\n            <div class="row">\r\n                <div class="col-md-6">\r\n                    <p>Email: <a data-bind="text: user().email, attr: { href: \'mailto:\' + user().email() }"></a></p>\r\n                    <p data-bind="visible: user().hasPhone">Telefon: <a data-bind="text: user().phone, attr: { href: \'tel:\' + user().phone() }"></a></p>\r\n                    <p>Benutzername: <span data-bind="text: user().userName"></span></p>\r\n                    <p data-bind="visible: user().roles().length">Rollen: <em><!-- ko foreach: user().roles --><span data-bind="text: $data + (($index < $parent.user().roles().length) ? \', \' : \'\')"></span><!-- /ko --></em></p>                                    \r\n                </div>\r\n                <div class="col-md-6">\r\n                    <p>Erstellt: <span data-bind="attr: { title: moment(user().creationDate()).format(\'LLLL\') }, text: user().creationDateFormatted, textTimeout: { interval: 30000, observable: user().creationDate }"></span></p>      \r\n                    <p data-bind="visible: user().hasEverLoggedIn">Letzte Anmeldung: <em data-bind="attr: { title: moment(user().lastLoginDate()).format(\'LLLL\') }, text: user().lastLoginDateFormatted(), textTimeout: { interval: 30000, observable: user().lastLoginDate }"></em></p>  \r\n                    <p data-bind="visible: user().hasEverLoggedIn">Zuletzt aktiv: <em data-bind="attr: { title: moment(user().lastActivityDate()).format(\'LLLL\') }, text: user().lastActivityDateFormatted, textTimeout: { interval: 30000, observable: user().lastActivityDate }"></em></p>  \r\n                    <p data-bind="visible: user().hasEverChangedPassword">Passwort-Änderung: <em data-bind="attr: { title: moment(user().lastPasswordChangedDate()).format(\'LLLL\') }, text: user().lastPasswordChangedDateFormatted, textTimeout: { interval: 30000, observable: user().lastPasswordChangedDate }"></em></p>\r\n                    <p data-bind="visible: !user().hasEverLoggedIn()">Noch nie angemeldet</p>\r\n                </div>\r\n\r\n            </div>\r\n        </div>\r\n\r\n        <!-- ko if: user().comment().length -->\r\n        <h5>Notizen</h5>        \r\n        <div class="well well-small">\r\n            <div class="row">\r\n                <p data-bind="text: user().comment"></p>\r\n            </div>\r\n        </div>\r\n        <!-- /ko -->\r\n\r\n        <h5>Optionen</h5>\r\n        <div class="row">\r\n            <div class="col-md-6">\r\n                <ul class="list-unstyled fa-ul full-height">\r\n                    <li><i class="fa fa-li fa-wrench"></i> <a href="#" data-bind="click: changePassword">Passwort festlegen</a> </li>\r\n                </ul>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    \r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: navigateBack">\r\n                        <i class="fa fa-arrow-left"></i> Zurück</a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: editUser">\r\n                        <i class="fa fa-edit" ></i> Bearbeiten</a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: deleteUser">\r\n                        <i class="fa fa-times"></i> Löschen</a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n        <div class="navbar-panel pull-right">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" title="Aktualisieren" data-bind="click: refresh"><i class="fa fa-refresh fa-fw" data-bind="css: { \'fa-spin\': isLoading }"></i></a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n\r\n</div>';});

define('text!modules/user/views/userEditor.html',[],function () { return '\r\n<div id="user-editor" class="app-page bottom-fixed-navbar-container">\r\n    <div class="container">\r\n        <!-- ko if: isNewUser() -->\r\n        <h2>Neuer Benutzer</h2>\r\n        <!-- /ko -->\r\n        <!-- ko if: !isNewUser() && user() -->\r\n        <h2><span data-bind="text: user().fullName"></span> <small>Bearbeiten</small></h2>\r\n        <!-- /ko -->\r\n    </div>\r\n\r\n    <form id="theform" data-bind="submit: save" class="full-height">\r\n        <div class="container">\r\n            <div class="row">\r\n                <div class="col-md-6">\r\n                    <!-- ko if: user() -->\r\n                    <!-- ko composeEditor: { field: user().firstName, title: \'Vorname\', valueUpdate: \'afterkeydown\', popoverPlacement: \'bottom\', css: \'form-control\' } --><!-- /ko -->\r\n                    <!-- ko composeEditor: { field: user().lastName, title: \'Nachname\', valueUpdate: \'afterkeydown\', popoverPlacement: \'bottom\', css: \'form-control\' } --><!-- /ko -->\r\n                    <!-- /ko -->\r\n                    <!-- ko if: isNewUser() -->\r\n                    <!-- ko composeEditor: { field: user().userName, title: \'Benutzer\', popoverPlacement: \'bottom\', css: \'form-control\' } --><!-- /ko -->\r\n                    <!-- ko composeEditor: { field: user().password, title: \'Passwort\', valueUpdate: \'afterkeydown\', popoverPlacement: \'bottom\', css: \'form-control\' } --><!-- /ko -->\r\n                    <!-- /ko -->\r\n                    <!-- ko if: user() -->\r\n                    <!-- ko composeEditor: { field: user().email, title: \'Email\', valueUpdate: \'afterkeydown\', popoverPlacement: \'bottom\', css: \'form-control\' } --><!-- /ko -->\r\n                    <!-- ko composeEditor: { field: user().phone, title: \'Telefon\', valueUpdate: \'afterkeydown\', popoverPlacement: \'bottom\', css: \'form-control\' } --><!-- /ko -->\r\n                    <!-- /ko -->\r\n                </div>\r\n\r\n                <div class="col-md-6">\r\n                    <!-- ko if: user() -->\r\n                    <!-- ko composeEditor: { type: \'textarea\', field: user().comment, title: \'Notizen\', valueUpdate: \'afterkeydown\', popoverPlacement: \'bottom\', css: \'form-control\' } --><!-- /ko -->\r\n                    <!-- /ko -->\r\n                    <div>\r\n                        <!-- ko if: roles() && roles().length -->\r\n                        <label>Rollen</label>\r\n                        <div class="checkbox" data-bind="foreach: roles">\r\n                            <label>\r\n                                <input type="checkbox" data-bind="checked: isChecked, enable: isEnabled" /> <!-- ko text: role --><!-- /ko -->\r\n                            </label>\r\n                        </div>\r\n                        <!-- /ko -->\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </form>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="pull-right">\r\n            <!-- ko if: !user().isValid() -->\r\n            <!-- ko validationSummary: { entity: user() } --><!-- /ko -->\r\n            <!-- /ko -->\r\n        </div>\r\n\r\n        <div class="navbar-panel">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: cancel"><i class="fa fa-arrow-left"></i> Zurück</a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: save, enable: user.isDirty()"><i class="fa fa-save"></i> Speichern</a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n\r\n</div>';});

define('viewmodels/changePasswordDialog',["plugins/dialog","knockout","durandal/app"],function(e,t,n){var r=function(){var e=this;e.oldPassword=t.observable("").extend({required:!0}),e.newPassword=t.observable("").extend({required:!0,minLength:6}),e.confirmPassword=t.observable("").extend({required:!0,equal:e.newPassword}),t.validation.group(e)};return r.prototype.ok=function(){this.isValid()?e.close(this,{oldPassword:this.oldPassword(),newPassword:this.newPassword(),confirmPassword:this.confirmPassword()}):n.showMessage("Das Passwort kann noch nicht geändert werden. Prüfe die markierten Felder und korrigiere die Eingaben entsprechend.","Unvollständig")},r.prototype.cancel=function(){e.close(this,null)},r.show=function(){return e.show(new r)},r});
define('viewmodels/forbidden',['require'],function(e){var t=e("authentication");return{authentication:t}});
define('viewmodels/login',['require'],function(e){function t(){m(!0),o.logon(d(),f(),p()).then(function(){l.redirectFromLogonView()}).fail(function(e){s.showMessage(e.responseJSON.error_description,"Fehlgeschlagen")}).done(function(){m(!1)})}function n(){d(null),f(null),p(!1)}function r(){var e=c("#login-form");c(".autofocus",e).each(function(){c(this).focus()})}function i(){v(!0),o.getExternalLoginProviders("/",!0).then(function(e){var t=u.utils.arrayMap(e,function(e){return new a(e)});g(t),v(!1)})}function a(e){var t=this;t.name=u.observable(e.name),t.login=function(){sessionStorage.state=e.state,sessionStorage.loginUrl=e.url,s.archiveSessionStorageToLocalStorage(),l.logonSuccessRoute&&(localStorage.logonSuccessRoute=l.logonSuccessRoute.config.hash),window.location=e.url}}var o=e("authentication"),s=e("durandal/app"),l=(e("durandal/system"),e("plugins/router")),u=e("knockout"),c=e("jquery"),d=u.observable().extend({required:!0}),f=u.observable().extend({required:!0}),p=u.observable(!1),h=u.observable(!1),m=u.observable(!1),v=u.observable(!1),g=u.observableArray(),b={userName:d,password:f,rememberMe:p,logon:t,isBusy:u.computed(function(){return m()||l.isNavigating()}),userNameFocused:h,activate:function(){n(),i(),r()},compositionComplete:function(){r()},isLoadingExternalLoginProviders:v,externalLoginProviders:g};return u.validation.group(b),b});
define('viewmodels/setPasswordDialog',["plugins/dialog","knockout","durandal/app"],function(e,t,n){var r=function(){var e=this;e.newPassword=t.observable("").extend({required:!0,minLength:6}),e.confirmPassword=t.observable("").extend({required:!0,equal:e.newPassword}),t.validation.group(e)};return r.prototype.ok=function(){this.isValid()?e.close(this,{newPassword:this.newPassword(),confirmPassword:this.confirmPassword()}):n.showMessage("Das Passwort kann noch nicht erstellt werden. Prüfe die markierten Felder und korrigiere die Eingaben entsprechend.","Unvollständig")},r.prototype.cancel=function(){e.close(this,null)},r.show=function(){return e.show(new r)},r});
define('viewmodels/profile',["durandal/app","authentication","plugins/router","plugins/dialog","./changePasswordDialog","moment","knockout","toastr","infrastructure/screen","Q","./setPasswordDialog"],function(e,t,n,r,i,a,o,s,l,u,c){function d(t){var n=this;n.name=o.observable(t.name),n.login=function(){sessionStorage.state=t.state,sessionStorage.associatingExternalLogin=!0,e.archiveSessionStorageToLocalStorage(),window.location=t.url}}function f(e,n){var r=this,i=o.observable(e.providerKey);r.loginProvider=o.observable(e.loginProvider),r.removing=o.observable(!1),r.canRemove=o.computed(function(){return n.logins().length>1}),r.remove=function(){r.removing(!0),t.removeLogin(r.loginProvider(),i()).then(function(){n.logins.remove(r)})}}var p=t.user,h=o.observableArray(),m=o.observableArray(),v=o.observable(),g={user:p,logins:h,externalLoginProviders:m,activate:function(){return h([]),m([]),t.getAccountManagementInfo(escape("/"),!0).then(function(e){v(e.localLoginProvider),o.utils.arrayForEach(e.logins,function(e){h.push(new f(e,g))}),o.utils.arrayForEach(e.loginProviders,function(e){m.push(new d(e))})})},lastPasswordChangedDateFormatted:o.computed(function(){return p().hasEverChangedPassword()?a.utc(p().lastPasswordChangedDate()).fromNow():"Noch nie"}),changePassword:function(){function e(e){return e?t.changePassword(e).then(function(){s.success("Das Passwort wurde erfolgreich geändert.","Passwort geändert",{positionClass:l.isPhone()?"toast-bottom-full-width":"toast-bottom-right"})}).fail(function(){r.showMessage("Das Passwort konnte nicht geändert werden. Versuche es in einigen Minuten nochmal. Melde das Problem, wenn es weiterhin auftritt","Nicht erfolgreich")}):void 0}i.show().then(e)},addLocalPassword:function(){function e(e){return e?t.setPassword(e).then(function(){h.push(new f({loginProvider:v(),providerKey:p().userName()},g))}):void 0}c.show().then(e)},logOff:function(){t.isAuthenticated()===!0&&t.logoff().then(n.navigate("login",{trigger:!0,replace:!0}))},hasLocalPassword:o.computed(function(){var e=o.utils.arrayFirst(h(),function(e){return e.loginProvider()===v()});return!!e}),moment:a};return g});
define('viewmodels/shell',["plugins/router","durandal/app","authentication","infrastructure/moduleRouter","infrastructure/moduleRegistry","ko"],function(e,t,n,r,i,a){return{router:e,authentication:n,activate:function(){return e.map([{route:"",moduleId:"viewmodels/welcome",title:"Willkommen",nav:!1},{route:"login",moduleId:"viewmodels/login",title:"Anmelden",nav:!1},{route:"forbidden",moduleId:"viewmodels/forbidden",title:"Nicht erlaubt",nav:!1},{route:"profile",moduleId:"viewmodels/profile",title:"Mein Profil",nav:!1,hash:"#profile"},{route:"website",moduleId:"viewmodels/websites",title:"Website",nav:!1},{route:"templates/:websiteId/create",moduleId:"viewmodels/templateEditor",title:"Vorlage erstellen",nav:!1},{route:"templates/:websiteId/edit/:id",moduleId:"viewmodels/templateEditor",title:"Vorlage bearbeiten",nav:!1}]),r.mapModuleRoutes(e).buildNavigationModel().activate()},navigationItemTemplate:function(e){return e.isModuleRoute&&e.isModuleRoute===!0?"module-tile":"default-tile"},navigationItems:a.computed(function(){return a.utils.arrayFilter(e.navigationModel(),function(e){return n.isAuthenticated()&&(!e.roles||n.user().isInAnyRole(e.roles))})}),showModule:function(e){require([e.moduleId],function(e){e.router.navigateToModule()})},logOff:function(){n.isAuthenticated()===!0&&n.logoff().then(e.navigate("login",{trigger:!0,replace:!0}))}}});
define('viewmodels/templateEditor',["ko","entityManagerProvider","plugins/router","breeze","durandal/app"],function(e,t,n,r,i){function a(){function r(e){var t=u.createEntity("DraftTemplate",{Name:"Neue Vorlage",WebsiteId:e,TemplateContent:JSON.stringify(s,null,4)});u.addEntity(t),c(t)}function a(e){var t=(new o).from("DraftTemplates").where("Id","==",e);return u.executeQuery(t).then(function(e){var t=e.results[0];c(t)})}var l=this,u=t.createManager(),c=e.observable();l.template=c,l.title=e.computed(function(){var e=c();return e&&e.Name().length?e.Name():"Neue Vorlage"}),l.activate=function(e,t){t?a(t):r(e)},l.navigateBack=function(){n.navigateBack()},l.saveChanges=function(){u.saveChanges().then(n.navigateBack)},l.deleteTemplate=function(){var e="Vorlage löschen",t="Abbrechen";i.showMessage("Soll die Vorlage wirklich gelöscht werden?","Vorlage löschen",[e,t]).then(function(t){return t===e?(c().entityAspect.setDeleted(),u.saveChanges().then(function(){i.trigger("caps:draftTemplate:deleted",c().Id()),n.navigateBack()})):void 0})}}var o=r.EntityQuery,s={name:"",rows:[{cells:[{name:"",title:"",colspan:12,contentType:"markdown",content:""}]}],parameters:[{name:"",title:"",type:"String",value:""}]};return a});
define('viewmodels/websites',["durandal/system","durandal/app","infrastructure/datacontext","entityManagerProvider","ko","breeze","plugins/router"],function(e,t,n,r,i,a,o){function s(){return e.defer(function(e){function t(){e.resolve(n)}var n=d.createEntity("Website",{Name:"My Caps Website",Url:"http://caps.luxbox.net"});d.saveChanges().then(t).fail(e.reject)}).promise()}function l(){var e=(new c).from("Websites").expand("DraftTemplates");return d.executeQuery(e)}var u=i.observable(),c=a.EntityQuery,d=r.createManager();return t.on("caps:draftTemplate:deleted",function(e){var t=i.utils.arrayFirst(u().DraftTemplates(),function(t){return t.Id()===e});t&&d.detachEntity(t)}),{website:u,activate:function(){l().then(function(e){e.results.length>0?u(e.results[0]):s().then(function(e){u(e)})})},saveChanges:function(){d.saveChanges().then(o.navigateBack)},navigateBack:function(){o.navigateBack()},addTemplate:function(){o.navigate("#templates/"+u().Id()+"/create")},editTemplate:function(e){o.navigate("#templates/"+u().Id()+"/edit/"+e.Id())}}});
define('viewmodels/welcome',["knockout","infrastructure/datacontext","durandal/system","authentication"],function(e,t,n,r){var i=function(){this.displayName="Willkommen bei CAPS",this.description="Caps ist ein einfaches Content Management System zur Erstellung und Verwaltung Ihrer öffentlichen Inhalte.",this.websites=e.observableArray(),this.user=r.user,n.log("welcome model created")};return i.prototype.activate=function(){var n=this;return t.getWebsites().then(function(t){e.utils.arrayForEach(t.results,function(e){n.websites.push(e)})})},i});
define('text!views/changePasswordDialog.html',[],function () { return '<div class="messageBox" id="change-password-dlg">\n    <div class="modal-header">\n        <h4>Passwort ändern</h4>\n    </div>\n    <div class="modal-body">\n        <form data-bind="submit: ok">\n            <p class="message">Das Passwort muss mindestens 6 Zeichen lang sein.</p>            \n            <!-- ko composeEditor: { field: oldPassword, title: \'Altes Passwort\', valueUpdate: \'afterkeydown\', css: \'form-control autofocus\', type: \'password\' } --><!-- /ko -->\n            <!-- ko composeEditor: { field: newPassword, title: \'Neues Passwort\', valueUpdate: \'afterkeydown\', css: \'form-control\', type: \'password\' } --><!-- /ko -->\n            <!-- ko composeEditor: { field: confirmPassword, title: \'Neues Passwort bestätigen\', valueUpdate: \'afterkeydown\', css: \'form-control\', type: \'password\' } --><!-- /ko -->\n        </form>\n    </div>\n    <div class="modal-footer">\n        <button class="btn btn-primary" data-bind="click: ok">Passwort ändern</button>\n        <button class="btn btn-default" data-bind="click: cancel">Abbrechen</button>\n    </div>\n</div>';});

define('text!views/editorTemplates/checkboxTemplate.html',[],function () { return '<div class="checkbox" data-bind="css: { \'has-error\': !field.isValid() }">\r\n    <label>\r\n        <input type="checkbox" data-bind="checked: field" /> <!-- ko text: title --><!-- /ko -->\r\n    </label>\r\n</div>';});

define('text!views/editorTemplates/inputTemplate.html',[],function () { return '<div class="form-group" data-bind="css: { \'has-error\': !field.isValid() }, uniqueId: { value: field, prefix: \'ctrls\' }">\r\n    <label data-bind="text: title, uniqueFor: field"></label>\r\n        <input type="text"\r\n            data-bind="value: field, valueUpdate: valueUpdate, uniqueId: true, tooltip: { title: field.error(), placement: \'bottom\', trigger: \'hover\' }, css: css, attr: { placeholder: placeholder }, cancelZoom: true" />\r\n</div>';});

define('text!views/editorTemplates/passwordTemplate.html',[],function () { return '<div class="form-group" data-bind="css: { \'has-error\': !field.isValid() }, uniqueId: { value: field, prefix: \'ctrls\' }">\r\n    <label data-bind="text: title, uniqueFor: field"></label>\r\n    <input type="password"\r\n        data-bind="value: field, valueUpdate: valueUpdate, uniqueId: true, tooltip: { title: field.error(), placement: \'bottom\', trigger: \'hover\' }, css: css, attr: { placeholder: placeholder }, cancelZoom: true" />\r\n</div>';});

define('text!views/editorTemplates/textareaTemplate.html',[],function () { return '<div class="form-group" data-bind="css: { \'has-error\': !field.isValid() }, uniqueId: { value: field, prefix: \'ctrls\' }">\r\n    <label data-bind="text: title, uniqueFor: field"></label>\r\n    <textarea rows="6"\r\n        data-bind="value: field, valueUpdate: valueUpdate, uniqueId: true, tooltip: { title: field.error(), placement: \'bottom\', trigger: \'hover\' }, css: css, attr: { placeholder: placeholder }, cancelZoom: true" />\r\n</div>';});

define('text!views/forbidden.html',[],function () { return '<div class="app-page">\r\n    <div class="container">\r\n        <div class="text-center">\r\n            <h1 class="splash-message">I\'m sorry, <span data-bind="text: authentication.user().userName"></span>. I\'m afraid I can\'t do that.</h1>\r\n            <p>Bitte Deinen Administrator um die nötigen Zugriffsrechte, wenn Du denkst, dass Du diesen Bereich brauchst.</p>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!views/login.html',[],function () { return '<div id="login-form" class="app-page">\r\n\r\n    <div class="container">\r\n\r\n        <div class="row">\r\n            <div class="col-md-6 col-md-offset-3">\r\n                <h3>Anmelden</h3>\r\n            </div>\r\n        </div>\r\n\r\n        <form data-bind="submit: logon, enable: !isBusy()">\r\n            <div class="row">\r\n                <div class="col-md-6 col-md-offset-3">\r\n                    <!-- ko composeEditor: { field: userName, title: \'Benutzername\', valueUpdate: \'afterkeydown\', popoverTrigger: \'hover\', popoverPlacement: \'bottom\', css: \'form-control autofocus\' } --><!-- /ko -->\r\n                </div>\r\n            </div>\r\n\r\n            <div class="row">\r\n                <div class="col-md-6 col-md-offset-3">\r\n                    <!-- ko composeEditor: { field: password, title: \'Passwort\', valueUpdate: \'afterkeydown\', type: \'password\', popoverTrigger: \'hover\', popoverPlacement: \'bottom\', css: \'form-control\' } --><!-- /ko -->\r\n                </div>\r\n            </div>\r\n\r\n            <div class="row">\r\n                <div class="col-md-6 col-md-offset-3">\r\n                    <!-- ko composeEditor: { field: rememberMe, title: \'Angemeldet bleiben\', type: \'checkbox\' } --><!-- /ko -->\r\n                </div>\r\n            </div>\r\n\r\n            <div class="row">\r\n                <div class="col-md-6 col-md-offset-3">\r\n                    <div class="pull-right">\r\n                        <!-- ko if: !isValid() -->\r\n                        <!-- ko validationSummary: { entity: $data } --><!-- /ko -->\r\n                        <!-- /ko -->\r\n\r\n                        <div class="form-status" data-bind="visible: isValid() && isBusy()">\r\n                            <p>Wird geprüft... <i class="fa fa-spinner fa-spin"></i></p>\r\n                        </div>\r\n                    </div>\r\n                    <button class="btn btn-primary btn-medium" data-bind="click: logon, enable: isValid() && !isBusy()">Und los</button>\r\n                </div>\r\n            </div>\r\n        </form>\r\n\r\n        <div class="row">\r\n            <div class="col-md-6 col-md-offset-3">\r\n                <h3>oder mit einem der folgenden:</h3>\r\n                <!-- ko if: isLoadingExternalLoginProviders -->\r\n                <em>Wird geladen...</em>\r\n                <!-- /ko -->\r\n                <!-- ko if: !isLoadingExternalLoginProviders() -->\r\n                <ul data-bind="foreach: externalLoginProviders" class="list-unstyled">\r\n                    <li><a class="btn btn-default" href="#" data-bind="click: login, text: name"></a></li>\r\n                </ul>\r\n                <!-- /ko -->\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!views/partial/validationSummary.html',[],function () { return '<div class="error-summary-container" data-bind="tooltip: { title: title, placement: \'left\', trigger: \'hover\' }">\r\n    <div class="error-summary">\r\n        <!-- ko text: entity.errors().length --><!-- /ko -->\r\n    </div>\r\n</div>';});

define('text!views/profile.html',[],function () { return '<div id="user-profile" class="app-page bottom-fixed-navbar-container">\r\n\r\n    <div class="container">\r\n        <h2><!-- ko text: user().fullName --><!-- /ko --> <small>Mein Profil</small></h2>\r\n        <div class="well">\r\n            <p>\r\n                <!-- ko if: hasLocalPassword -->\r\n                Letzte Passwort-Änderung: <span data-bind="text: lastPasswordChangedDateFormatted, attr: { title: moment(user().lastPasswordChangedDate()).format(\'LLLL\') }"></span><br />\r\n                <a href="#" data-bind="click: changePassword">Passwort ändern</a>\r\n                <!-- /ko -->\r\n                <!-- ko if: !hasLocalPassword() -->\r\n                <a href="#" data-bind="click: addLocalPassword">Lokales Passwort erstellen</a>\r\n                <!-- /ko -->\r\n            </p>\r\n        </div>\r\n\r\n        <h3>Registrierte Logins</h3>\r\n        <ul data-bind="foreach: logins">\r\n            <li>\r\n                <span data-bind="text: loginProvider"></span>\r\n                <!-- ko if: !removing() && canRemove() -->\r\n                <a href="#" data-bind="click: remove">Entfernen</a>\r\n                <!-- /ko -->\r\n                <!-- ko if: removing -->\r\n                <em>Wird entfernt...</em>\r\n                <!-- /ko -->\r\n            </li>\r\n        </ul>\r\n\r\n        <h3>Externe Anmeldung hinzufügen</h3>\r\n        <ul data-bind="foreach: externalLoginProviders()">\r\n            <li>\r\n                <span data-bind="text: name"></span> <a href="#" data-bind="click: login">Hinzufügen</a>\r\n            </li>\r\n        </ul>\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel pull-left">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: logOff">\r\n                        <i class="fa fa-power-off fa-fw"></i> Abmelden\r\n                    </a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>';});

define('text!views/setPasswordDialog.html',[],function () { return '<div class="messageBox" id="change-password-dlg">\n    <div class="modal-header">\n        <h4>Lokales Passwort erstellen</h4>\n    </div>\n    <div class="modal-body">\n        <form data-bind="submit: ok">\n            <p class="message">Das Passwort muss mindestens 6 Zeichen lang sein.</p>            \n            <!-- ko composeEditor: { field: newPassword, title: \'Neues Passwort\', valueUpdate: \'afterkeydown\', css: \'form-control\', type: \'password\' } --><!-- /ko -->\n            <!-- ko composeEditor: { field: confirmPassword, title: \'Neues Passwort bestätigen\', valueUpdate: \'afterkeydown\', css: \'form-control\', type: \'password\' } --><!-- /ko -->\n        </form>\n    </div>\n    <div class="modal-footer">\n        <button class="btn btn-primary" data-bind="click: ok">Ok</button>\n        <button class="btn btn-default" data-bind="click: cancel">Abbrechen</button>\n    </div>\n</div>';});

define('text!views/shell.html',[],function () { return '<div>\r\n    <div class="navbar navbar-inverse navbar-fixed-top" role="navigation">\r\n        <div class="navbar-loader pull-right" data-bind="css: { active: router.isNavigating }">\r\n            <i class="fa fa-spinner fa-2x fa-spin"></i>\r\n        </div>\r\n\r\n        <ul id="nav-user" class="nav navbar-nav pull-right" data-bind="visible: authentication.isAuthenticated">\r\n            <li><a href="#profile"><strong data-bind="text: authentication.user().displayName()"></strong></a></li>\r\n            <li><a href="#" data-bind="click: logOff, clickBubble: false" title="Abmelden"><i class="fa fa-power-off"></i></a></li>                    \r\n        </ul>\r\n\r\n        <div class="navbar-header">\r\n            <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-ex1-collapse" data-bind="visible: authentication.isAuthenticated">\r\n                <span class="icon-bar"></span>\r\n                <span class="icon-bar"></span>\r\n                <span class="icon-bar"></span>\r\n            </button>\r\n\r\n            <a class="navbar-brand" data-bind="attr: { href: router.routes[0].hash }">\r\n                <strong>CAPS</strong>\r\n            </a>\r\n        </div>\r\n\r\n        <div class="collapse navbar-collapse navbar-ex1-collapse">\r\n            <ul class="nav navbar-nav navbar-right" data-bind="foreach: navigationItems">\r\n                <li data-bind="css: { active: isActive }, template: { name: $parent.navigationItemTemplate }"></li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n    \r\n    <div class="app-page-host">\r\n        <!--ko router: { transition:\'entrance\', cacheViews:true }--><!--/ko-->\r\n    </div>\r\n</div>\r\n\r\n<script type="text/html" id="default-tile">\r\n    <a data-bind="attr: { href: hash }, html: title"></a>\r\n</script>\r\n\r\n<script type="text/html" id="module-tile">\r\n    <a href="#" data-bind="click: $parent.showModule"><!-- ko text: title --><!-- /ko --> <span class="module-unsaved-data" data-bind="visible: hasUnsavedChanges">*</span></a>    \r\n    <div class="module-tile-progress" data-bind="css: { \'active\': hasLongRunningTasks() }">\r\n        <div data-bind="style: { width: taskInfo().progress + \'%\' }"></div>\r\n    </div>\r\n</script>';});

define('text!views/templateEditor.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n    <div class="panel-padding-h" data-bind="if: template()">\r\n\r\n        <div class="row">\r\n            <div class="col-md-9">\r\n                <div class="content-editor" data-bind="forceViewportHeight: { minWidth: 992 }">\r\n                    <textarea data-bind="value: template().TemplateContent" class="form-control" rows="20"></textarea>\r\n                </div>\r\n            </div>\r\n            <div class="col-md-3" data-bind="with: template()">\r\n                <div class="form-group">\r\n                    <label class="control-label">Name</label>\r\n                    <input type="text" data-bind="value: Name" class="form-control" />\r\n                </div>\r\n\r\n                <div class="form-group">\r\n                    <label class="control-label">Beschreibung</label>\r\n                    <textarea class="form-control" data-bind="value: Description" rows="15"></textarea>\r\n                </div>\r\n            </div>\r\n        </div>\r\n\r\n    </div>\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: navigateBack"><i class="fa fa-arrow-left"></i> Zurück</a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: saveChanges"><i class="fa fa-save"></i> Speichern</a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: deleteTemplate"><i class="fa fa-trash-o"></i> Vorlage Löschen</a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div> \r\n</div>';});

define('text!views/websites.html',[],function () { return '<div class="app-page bottom-fixed-navbar-container">\r\n    <!-- ko if: website() -->\r\n    <div class="panel-padding-h">\r\n        <h1>Meine Website</h1>\r\n\r\n        <div class="form-group">\r\n            <label>Name</label>\r\n            <input type="text" data-bind="value: website().Name" class="form-control" />\r\n        </div>\r\n\r\n        <div class="form-group">\r\n            <label>Adresse</label>\r\n            <input type="text" data-bind="value: website().Url" class="form-control" />\r\n        </div>\r\n\r\n        <h2>Entwurfs-Vorlagen</h2>\r\n        <ul data-bind="foreach: website().DraftTemplates" class="list-group">\r\n            <li class="list-group-item">\r\n                <a href="#" data-bind="click: $parent.editTemplate"><i class="fa fa-columns"></i> <!-- ko text: Name --><!-- /ko --></a>\r\n            </li>\r\n        </ul>\r\n\r\n        <a href="#" data-bind="click: addTemplate" class="btn btn-link"><i class="fa fa-plus"></i> Vorlage hinzufügen</a>\r\n    </div>\r\n\r\n\r\n    <div class="navbar navbar-default navbar-fixed-bottom">\r\n        <div class="navbar-panel">\r\n            <ul class="nav navbar-nav">\r\n                <li>\r\n                    <a href="#" data-bind="click: navigateBack"><i class="fa fa-arrow-left"></i> Zurück</a>\r\n                </li>\r\n                <li>\r\n                    <a href="#" data-bind="click: saveChanges"><i class="fa fa-save"></i> Speichern</a>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n    </div> \r\n    <!-- /ko -->\r\n</div>';});

define('text!views/welcome.html',[],function () { return '<div class="app-page">\r\n    <div class="container">\r\n        <div class="page-header">\r\n            <h1>Hallo <!-- ko text: user().displayName --><!-- /ko -->! <small>Willkommen bei Caps</small></h1>\r\n        </div>\r\n        <div class="container">\r\n            <div class="row">\r\n                <p data-bind="html: description"></p>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>';});

define('plugins/contentSelection',["durandal/app","durandal/system","plugins/dialog"],function(e,t){function n(e,t){i.dialogViewModelCtor=t}function r(e,n){e=e||{},i.dialogViewModelCtor||(t.log("contentSelection: No Dialog Model/View registered."),n.reject()),e.module&&e.module.showDialog(new i.dialogViewModelCtor(e)).then(n.resolve)}var i={dialogViewModelCtor:void 0,install:function(){e.selectContent=function(e){return t.defer(function(t){r(e,t)}).promise()}},registerDialog:n};return i});
define('plugins/fileSelection',["durandal/app","durandal/system","plugins/dialog"],function(e,t){function n(e){r=e}var r,i={install:function(){e.selectFiles=function(e){return t.defer(function(n){e=e||{},r||(t.log("fileSelection: No Dialog Model/View registered."),n.reject()),e.module&&e.module.showDialog(new r(e)).then(n.resolve)}).promise()}},registerDialog:n};return i});
define('plugins/http',["jquery","knockout"],function(e,t){return{callbackParam:"callback",get:function(t,n){return e.ajax(t,{data:n})},jsonp:function(t,n,r){return-1==t.indexOf("=?")&&(r=r||this.callbackParam,t+=-1==t.indexOf("?")?"?":"&",t+=r+"=?"),e.ajax({url:t,dataType:"jsonp",data:n})},post:function(n,r){return e.ajax({url:n,data:t.toJSON(r),type:"POST",contentType:"application/json",dataType:"json"})}}});
define('plugins/observable',["durandal/system","durandal/binder","knockout"],function(e,t,n){function r(e){var t=e[0];return"_"===t||"$"===t}function i(t){return!(!t||void 0===t.nodeType||!e.isNumber(t.nodeType))}function a(e){if(!e||i(e)||e.ko===n||e.jquery)return!1;var t=f.call(e);return-1==p.indexOf(t)&&!(e===!0||e===!1)}function o(e,t){var n=e.__observable__,r=!0;if(!n||!n.__full__){n=n||(e.__observable__={}),n.__full__=!0,h.forEach(function(n){e[n]=function(){r=!1;var e=b[n].apply(t,arguments);return r=!0,e}}),v.forEach(function(n){e[n]=function(){r&&t.valueWillMutate();var i=g[n].apply(e,arguments);return r&&t.valueHasMutated(),i}}),m.forEach(function(n){e[n]=function(){for(var i=0,a=arguments.length;a>i;i++)s(arguments[i]);r&&t.valueWillMutate();var o=g[n].apply(e,arguments);return r&&t.valueHasMutated(),o}}),e.splice=function(){for(var n=2,i=arguments.length;i>n;n++)s(arguments[n]);r&&t.valueWillMutate();var a=g.splice.apply(e,arguments);return r&&t.valueHasMutated(),a};for(var i=0,a=e.length;a>i;i++)s(e[i])}}function s(t){var i,s;if(a(t)&&(i=t.__observable__,!i||!i.__full__)){if(i=i||(t.__observable__={}),i.__full__=!0,e.isArray(t)){var l=n.observableArray(t);o(t,l)}else for(var c in t)r(c)||i[c]||(s=t[c],e.isFunction(s)||u(t,c,s));y&&e.log("Converted",t)}}function l(e,t,n){var r;e(t),r=e.peek(),n?r?r.destroyAll||o(r,e):(r=[],e(r),o(r,e)):s(r)}function u(t,r,i){var a,u,c=t.__observable__||(t.__observable__={});if(void 0===i&&(i=t[r]),e.isArray(i))a=n.observableArray(i),o(i,a),u=!0;else if("function"==typeof i){if(!n.isObservable(i))return null;a=i}else e.isPromise(i)?(a=n.observable(),i.then(function(t){if(e.isArray(t)){var r=n.observableArray(t);o(t,r),t=r}a(t)})):(a=n.observable(i),s(i));return Object.defineProperty(t,r,{configurable:!0,enumerable:!0,get:a,set:n.isWriteableObservable(a)?function(t){t&&e.isPromise(t)?t.then(function(t){l(a,t,e.isArray(t))}):l(a,t,u)}:void 0}),c[r]=a,a}function c(t,r,i){var a,o={owner:t,deferEvaluation:!0};return"function"==typeof i?o.read=i:("value"in i&&e.error('For defineProperty, you must not specify a "value" for the property. You must provide a "get" function.'),"function"!=typeof i.get&&e.error('For defineProperty, the third parameter must be either an evaluator function, or an options object containing a function called "get".'),o.read=i.get,o.write=i.set),a=n.computed(o),t[r]=a,u(t,r,a)}var d,f=Object.prototype.toString,p=["[object Function]","[object String]","[object Boolean]","[object Number]","[object Date]","[object RegExp]"],h=["remove","removeAll","destroy","destroyAll","replace"],v=["pop","reverse","sort","shift","splice"],m=["push","unshift"],g=Array.prototype,b=n.observableArray.fn,y=!1;return d=function(e,t){var r,i,a;return e?(r=e.__observable__,r&&(i=r[t])?i:(a=e[t],n.isObservable(a)?a:u(e,t,a))):null},d.defineProperty=c,d.convertProperty=u,d.convertObject=s,d.install=function(e){var n=t.binding;t.binding=function(e,t,r){r.applyBindings&&!r.skipConversion&&s(e),n(e,t)},y=e.logConversion},d});
define('plugins/serializer',["durandal/system"],function(e){return{typeAttribute:"type",space:void 0,replacer:function(e,t){if(e){var n=e[0];if("_"===n||"$"===n)return void 0}return t},serialize:function(t,n){return n=void 0===n?{}:n,(e.isString(n)||e.isNumber(n))&&(n={space:n}),JSON.stringify(t,n.replacer||this.replacer,n.space||this.space)},getTypeId:function(e){return e?e[this.typeAttribute]:void 0},typeMap:{},registerType:function(){var t=arguments[0];if(1==arguments.length){var n=t[this.typeAttribute]||e.getModuleId(t);this.typeMap[n]=t}else this.typeMap[t]=arguments[1]},reviver:function(e,t,n,r){var i=n(t);if(i){var a=r(i);if(a)return a.fromJSON?a.fromJSON(t):new a(t)}return t},deserialize:function(e,t){var n=this;t=t||{};var r=t.getTypeId||function(e){return n.getTypeId(e)},i=t.getConstructor||function(e){return n.typeMap[e]},a=t.reviver||function(e,t){return n.reviver(e,t,r,i)};return JSON.parse(e,a)}}});
define('plugins/siteMapNodeSelection',["durandal/app","durandal/system","plugins/dialog"],function(e,t){function n(e){i.dialogViewModelCtor=e}function r(e,n){e=e||{},i.dialogViewModelCtor||(t.log("siteMapNodeSelection: No Dialog Model/View registered."),n.reject()),e.module&&e.module.showDialog(new i.dialogViewModelCtor(e)).then(n.resolve)}var i={dialogViewModelCtor:void 0,install:function(){e.selectSiteMapNode=function(e){return t.defer(function(t){r(e,t)}).promise()}},registerDialog:n};return i});
define('plugins/widget',["durandal/system","durandal/composition","jquery","knockout"],function(e,t,n,r){function i(e,n){var i=r.utils.domData.get(e,l);i||(i={parts:t.cloneNodes(r.virtualElements.childNodes(e))},r.virtualElements.emptyNode(e),r.utils.domData.set(e,l,i)),n.parts=i.parts}var a={},o={},s=["model","view","kind"],l="durandal-widget-data",u={getSettings:function(t){var n=r.utils.unwrapObservable(t())||{};if(e.isString(n))return{kind:n};for(var i in n)n[i]=-1!=r.utils.arrayIndexOf(s,i)?r.utils.unwrapObservable(n[i]):n[i];return n},registerKind:function(e){r.bindingHandlers[e]={init:function(){return{controlsDescendantBindings:!0}},update:function(t,n,r,a,o){var s=u.getSettings(n);s.kind=e,i(t,s),u.create(t,s,o,!0)}},r.virtualElements.allowedBindings[e]=!0,t.composeBindings.push(e+":")},mapKind:function(e,t,n){t&&(o[e]=t),n&&(a[e]=n)},mapKindToModuleId:function(e){return a[e]||u.convertKindToModulePath(e)},convertKindToModulePath:function(e){return"widgets/"+e+"/viewmodel"},mapKindToViewId:function(e){return o[e]||u.convertKindToViewPath(e)},convertKindToViewPath:function(e){return"widgets/"+e+"/view"},createCompositionSettings:function(e,t){return t.model||(t.model=this.mapKindToModuleId(t.kind)),t.view||(t.view=this.mapKindToViewId(t.kind)),t.preserveContext=!0,t.activate=!0,t.activationData=t,t.mode="templated",t},create:function(e,n,r,i){i||(n=u.getSettings(function(){return n},e));var a=u.createCompositionSettings(e,n);t.compose(e,a,r)},install:function(e){if(e.bindingName=e.bindingName||"widget",e.kinds)for(var n=e.kinds,a=0;a<n.length;a++)u.registerKind(n[a]);r.bindingHandlers[e.bindingName]={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,r,a){var o=u.getSettings(t);i(e,o),u.create(e,o,a,!0)}},t.composeBindings.push(e.bindingName+":"),r.virtualElements.allowedBindings[e.bindingName]=!0}};return u});
define('transitions/entrance',["durandal/system","durandal/composition","jquery"],function(e,t,n){var r=100,i={marginRight:0,marginLeft:0,opacity:1},a={marginLeft:"",marginRight:"",opacity:"",display:""},o=function(t){return e.defer(function(e){function o(){l(),e.resolve()}function s(){d=f.css("overflow-x"),f.css("overflow-x","hidden")}function l(){d&&f.css("overflow-x",d)}function u(){t.keepScrollPosition||n(document).scrollTop(0)}function c(){u(),s(),t.triggerAttach();var e={marginLeft:h?"0":"20px",marginRight:h?"0":"-20px",opacity:0,display:"block"},r=n(t.child);r.css(e),r.animate(i,{duration:p,easing:"swing",always:function(){r.css(a),o()}})}var d,f=n("body");if(t.child){var p=t.duration||500,h=!!t.fadeOnly;t.activeView?n(t.activeView).fadeOut({duration:r,always:c}):c()}else n(t.activeView).fadeOut(r,o)}).promise()};return o});
require(["main"]);
}());