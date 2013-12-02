define([], function () {

    var keys = {
        ENTER: 13,
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39,
        SPACEBAR: 32
    };

    return {
        keys: keys,

        getDirection: function (keyCode) {
            switch (keyCode) {
                case keys.UP: return 'up';
                case keys.RIGHT: return 'right';
                case keys.DOWN: return 'down';
                case keys.LEFT: return 'left';
            }
            return null;
        }
    };
});