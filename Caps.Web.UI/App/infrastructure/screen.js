define(['jquery'], function ($) {

    var $window = $(window);

    function isPhone() {
        return $window.width() <= 480;
    }

    return {
        isPhone: isPhone
    };

});