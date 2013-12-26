/*
 * moduleRouter.js
 */
define([
    'plugins/router',
    'durandal/system',
    'infrastructure/moduleRegistry',
    'ko',
    'infrastructure/utils',
    'durandal/composition'
],
function (rootRouter, system, moduleRegistry, ko, utils, composition) {
    
    function mapModuleRoutes(router) {
        ko.utils.arrayForEach(moduleRegistry.modules(), function (module) {
            mapModuleRoute(router, module);
        });
        return router;
    }

    function mapModuleRoute(router, module) {
        var route = module.routeConfig;
        if (!route)
            throw new Error('No moduleRoute found.');

        route.isModuleRoute = true;
        router.map(route);

        if (system.isFunction(module.initializeRouter))
            module.initializeRouter();
    }

    /**
    * Module Router Factory
    *
    */
    function createModuleRouter(module, baseModuleId, baseRoute) {
        var childRouter = rootRouter.createChildRouter()
            .makeRelative({
                moduleId: baseModuleId,
                route: baseRoute
            });
        extendRouter(childRouter, module);

        childRouter.on('router:navigation:complete', function (instance, instruction, router) {
            composition.current.complete(function () {
                module.trigger('module:compositionComplete', module, instance, instruction, router);
            });
        });

        return childRouter;
    }

    function extendRouter(router, module) {

        router.activeItem.settings.areSameItem = function (currentItem, newItem, currentActivationData, newActivationData) {
            if (currentItem == newItem || system.getModuleId(currentItem) == system.getModuleId(newItem)) {
                if (currentItem && system.isFunction(currentItem.shouldActivate))
                    return !currentItem.shouldActivate(router, currentActivationData, newActivationData);
                return utils.compareArrays(currentActivationData, newActivationData);
            }
            return false;
        };

        router.navigateToModule = function () {
            var ai = router.activeInstruction();
            if (ai == null) {
                router.navigate(module.routeConfig.hash);
            }
            else {
                router.navigate(ai.fragment);
            }
        };
    }

    return {
        mapModuleRoutes: mapModuleRoutes,
        createModuleRouter: createModuleRouter
    };

});