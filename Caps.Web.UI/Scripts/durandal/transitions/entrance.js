/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The entrance transition module.
 * @module entrance
 * @requires system
 * @requires composition
 * @requires jquery
 */
define(['durandal/system', 'durandal/composition', 'jquery'], function(system, composition, $) {
    var fadeOutDuration = 100;
    var endValues = {
        marginRight: 0,
        marginLeft: 0,
        opacity: 1
    };
    var clearValues = {
        marginLeft: '',
        marginRight: '',
        opacity: '',
        display: ''
    };

    /**
     * @class EntranceModule
     * @constructor
     */
    var entrance = function (context) {
        var savedOverflowX,
            $body = $('body');
        
        return system.defer(function(dfd) {
            function endTransition() {
                restoreOverflowX();
                dfd.resolve();
            }

            function hideOverflowX() {
                savedOverflowX = $body.css('overflow-x');
                $body.css('overflow-x', 'hidden');
            }

            function restoreOverflowX() {
                if (savedOverflowX)
                    $body.css('overflow-x', savedOverflowX);
            }

            function scrollIfNeeded() {
                if (!context.keepScrollPosition) {
                    $(document).scrollTop(0);
                }
            }

            if (!context.child) {
                $(context.activeView).fadeOut(fadeOutDuration, endTransition);
            } else {
                var duration = context.duration || 500;
                var fadeOnly = !!context.fadeOnly;

                function startTransition() {
                    scrollIfNeeded();
                    hideOverflowX();
                    context.triggerAttach();

                    var startValues = {
                        marginLeft: fadeOnly ? '0' : '20px',
                        marginRight: fadeOnly ? '0' : '-20px',
                        opacity: 0,
                        display: 'block'
                    };

                    var $child = $(context.child);

                    $child.css(startValues);
                    $child.animate(endValues, duration, 'swing', function () {
                        $child.css(clearValues);
                        endTransition();
                    });
                }

                if (context.activeView) {
                    $(context.activeView).fadeOut(fadeOutDuration, startTransition);
                } else {
                    startTransition();
                }
            }
        }).promise();
    };

    return entrance;
});
