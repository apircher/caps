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

    function formatFileSize(fileSizeInBytes) {
        var units = ["Bytes", "KB", "MB", "TB"];
        var unit = 0;
        var fileSize = fileSizeInBytes;

        while (fileSize > 1024) {
            fileSize /= 1024.0;
            if (unit++ >= 3)
                break;
        }
        var s = fileSize.toFixed(2).toLocaleString() + " " + units[unit];
        //TODO: Localization...
        return s.replace('.00', '').replace('.', ',');
    }

    function stringStartsWith(s, value) {
        s = s || '';
        if (value.length > s.length)
            return false;
        return s.substring(0, value.length) === value;
    };

    return {
        compareArrays: compareArrays,
        formatFileSize: formatFileSize,
        stringStartsWith: stringStartsWith
    };

});