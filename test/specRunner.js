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
        'knockout': '../Scripts/knockout-2.3.0',
        'knockout.validation': '../Scripts/knockout.validation',
        'knockout.custom-bindings': '../Scripts/knockout.custom-bindings',
        'knockout.extenders': '../Scripts/knockout.extenders',
        'bootstrap': '../Scripts/bootstrap',
        'jquery': '../Scripts/jquery-2.0.3',
        'Q': '../Scripts/q',
        'moment': '../Scripts/moment'
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
            'modules/testB/module': 'spec/testModuleB',
            'authentication': 'infrastructure/authentication'
        }        
    }
});


require(['jquery', 'jasmine-html', 'knockout', 'knockout.validation'], function ($, jasmine) {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;
    
    var htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };
    
    var specs = [
        'spec/testModuleA',
        'spec/testModuleB',
        'spec/knockout.custom-bindings.spec',
        'spec/knockout.extenders.spec',
        'spec/authentication.spec',
        'spec/moduleRegistry.spec',
        'spec/moduleRouter.spec',
        'spec/moduleLoader.spec',
        'spec/shell.spec',
        'spec/utils.spec',
        'spec/moduleFactory.spec',
        'spec/moduleHistory.spec',
        'spec/modules/user/entities.spec',
        'spec/modules/user/deleteUser.spec'
    ];

    $(function () {
        require(specs, function (spec) {
            jasmineEnv.execute();
        });
    });
});