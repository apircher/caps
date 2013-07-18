define(['plugins/router', 'durandal/system', 'infrastructure/moduleRegistry', 'infrastructure/moduleHistory', 'knockout', 'infrastructure/utils'], function (rootRouter, system, moduleRegistry, ModuleHistory, ko, utils) {
    
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
        var childRouter = rootRouter.createChildRouter();
        childRouter.makeRelative({
            moduleId: baseModuleId,
            route: baseRoute
        });
        extendRouter(childRouter, module);
        return childRouter;
    }

    function extendRouter(router, module) {

        router.moduleHistory = new ModuleHistory(module, router);

        router.activeItem.settings.areSameItem = function (currentItem, newItem, currentActivationData, newActivationData) {
            if (currentItem == newItem) {
                if (currentItem && system.isFunction(currentItem.shouldActivate))
                    return !currentItem.shouldActivate(router, currentActivationData, newActivationData);
                return utils.compareArrays(currentActivationData, newActivationData);
            }
            return false;
        };

        router.on('router:navigation:composition-complete', function (activation, instruction, r) {
            router.moduleHistory.registerActivation(activation, instruction);
        });

        router.navigateToModule = function () {
            router.moduleHistory.activateLast();
        };
    }


    return {
        mapModuleRoutes: mapModuleRoutes,
        createModuleRouter: createModuleRouter
    };

});