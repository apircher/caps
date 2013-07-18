define(['knockout'], function (ko) {

    function CapsModule (routeConfig) {
        this.routeConfig = routeConfig;
    };

    CapsModule.prototype.initializeRouter = function () {
    };

    function createModule(routeConfig) {
        routeConfig.hasUnsavedChanges = routeConfig.hasUnsavedChanges || ko.observable(false);
        return new CapsModule(routeConfig);
    }

    return {
        createModule: createModule,
        CapsModule: CapsModule
    };
});