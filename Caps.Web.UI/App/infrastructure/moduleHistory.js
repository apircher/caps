define(function () {

    function ModuleHistory(module, router) {
        this.module = module;
        this.router = router;
        this.activations = [];
    }

    ModuleHistory.prototype.registerActivation = function (activation, instruction) {
        this.activations.push({ activation: activation, instruction: instruction });
    };

    ModuleHistory.prototype.activateLast = function () {
        var lastActivation = this.activations.length ? this.activations[this.activations.length - 1] : undefined;
        if (lastActivation)
            return navigateToActivation(this.router, lastActivation);
        else
            return this.router.navigate(this.module.routeConfig.hash, true);
    };

    ModuleHistory.prototype.navigateBack = function () {
        this.activations.pop();
        var lastActivation = this.activations.pop();
        if (lastActivation)
            return navigateToActivation(this.router, lastActivation);
        else
            return this.router.navigate(this.module.routeConfig.hash, true);
    };

    function navigateToActivation(router, activation) {
        return router.navigate('#' + activation.instruction.fragment, true);
    }

    return ModuleHistory;

});