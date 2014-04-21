/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Provides a model for InteractionRequests. 
 * 
 * The idea comes from InteractionRequests in WPF. A viewmodel
 * triggers an InteractionRequest - like "scroll to item x" - and 
 * the view has its chance to handle it.
 */
define([], function () {
    'use strict';
    
    /**
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