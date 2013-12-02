define([], function () {
    
    /*
     * InteractionRequest class
     */

    function InteractionRequest(eventName) {
        this.eventName = eventName;
        this.context = null;
    }

    InteractionRequest.prototype.trigger = function () {
        if (this.context) this.context.trigger(this.eventName);
    };

    InteractionRequest.prototype.attach = function (context) {
        this.context = context;
    };

    return {
        InteractionRequest: InteractionRequest
    };
});