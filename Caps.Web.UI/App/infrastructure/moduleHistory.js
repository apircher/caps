define(function () {

    function ModuleHistory(module, router) {
        this.module = module;
        this.router = router;
        this.activations = [];
    }

    ModuleHistory.prototype.registerActivation = function (activation, instruction) {
        if (activation === this.lastActivation())
            return;
        this.activations.push({ activation: activation, instruction: instruction });
    };

    ModuleHistory.prototype.lastActivation = function () {
        if (!this.activations || !this.activations.length)
            return undefined;
        return this.activations[this.activations.length - 1];
    };

    ModuleHistory.prototype.activateLast = function () {
        var lastActivation = this.lastActivation();
        if (lastActivation)
            return navigateToActivation(this.router, lastActivation);
        else
            return this.router.navigate(this.module.routeConfig.hash);
    };

    ModuleHistory.prototype.navigateBack = function () {
        this.activations.pop();
        var lastActivation = this.activations.pop();
        if (lastActivation)
            return navigateToActivation(this.router, lastActivation);
        else
            return this.router.navigate(this.module.routeConfig.hash);
    };

    function navigateToActivation(router, activation) {
        return router.navigate('#' + activation.instruction.fragment);
    }

    return ModuleHistory;

});