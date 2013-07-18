define(function () {
    
    function compareArrays(first, second) {
        if (!first || !second)
            return false;
        if (first.length != second.length)
            return false;
        for (var i = 0, len = first.length; i < len; i++) {
            if (first[i] != second[i])
                return false;
        }
        return true;
    }

    return {
        compareArrays: compareArrays
    };

});