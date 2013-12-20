define([], function () {

    var regexPattern = /(?:<\s*)caps:([a-zA-Z0-9]*)(?:[^>]*\s*\/>)/gi;

    function replaceContentControls(content, replaceCallback) {

        replaceCallback = replaceCallback || defaultReplaceCallback;

        content = content.replace(regexPattern, function (hit, tagName, offset, s) {
            return replaceCallback.call(this, tagName, hit, offset);
        });

        return content;
    }

    function defaultReplaceCallback(tagName, hit, offset) {
        return '<div class="caps-ccctag">caps:<strong>' + tagName + '</strong></div>';
    }

    return {
        replaceContentControls: replaceContentControls
    };
});