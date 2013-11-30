if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return str && this.slice(0, str.length) == str;
    };
}


require.config({
    baseUrl: '../Caps.Web.UI/App/',
    paths: {
        'spec': '../../test/spec/',
        'jasmine': '../../test/lib/jasmine-1.3.1/jasmine',
        'jasmine-html': '../../test/lib/jasmine-1.3.1/jasmine-html',

        'text': '../Scripts/text',
        'durandal': '../Scripts/durandal',
        'plugins': '../Scripts/durandal/plugins',
        'transitions': '../Scripts/durandal/transitions',
                
        'entityManagerProvider': 'infrastructure/entityManagerProvider',
        'authentication': 'infrastructure/authentication',
        'localization': 'infrastructure/localization',

        'knockout.extenders': '../Scripts/knockout.extenders',        
        'typeahead': '../Scripts/typeahead',
        'moment': '../Scripts/moment',
        'doubleTap': '../Scripts/doubleTap'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jasmine': {
            exports: 'jasmine'
        },
        'jasmine-html': {
            deps: ['jasmine'],
            exports: 'jasmine'
        }

    },
    map: {
        '*': {
            'ko': 'knockout',
            'modules/testA/module': 'spec/testModuleA',
            'modules/testB/module': 'spec/testModuleB'
        }        
    }
});

define('jquery', function () { return jQuery; });
define('knockout', ko);
define('knockout.validation', ko.validation);
define('Q', function () { return Q; });
define('breeze', function () { return breeze; });

require(['jquery', 'jasmine-html', 'durandal/app', 'knockout', 'knockout.validation', 'durandal/system'], function ($, jasmine, app, system) {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;
    
    var htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    // Plug Q´s promise mechanism into Durandal.
    system.defer = function (action) {
        var deferred = Q.defer();
        action.call(deferred, deferred);
        var promise = deferred.promise;
        deferred.promise = function () {
            return promise;
        };
        return deferred;
    };
    
    app.configurePlugins({
        router: true,
        dialog: true,
        widget: true,
        fileSelection: true
    });
    app.start();
    
    var specs = [
        'spec/testModuleA',
        'spec/testModuleB',
        //'spec/knockout.custom-bindings.spec',
        'spec/knockout.extenders.spec',
        'spec/authentication.spec',
        'spec/moduleRegistry.spec',
        'spec/moduleRouter.spec',
        'spec/moduleLoader.spec',
        'spec/shell.spec',
        'spec/utils.spec',
        'spec/moduleFactory.spec',
        'spec/modules/user/entities.spec',
        'spec/modules/user/deleteUser.spec'
    ];

    $(function () {
        require(specs, function (spec) {
            jasmineEnv.execute();
        });
    });
});