define([], function () {

    return {
        mapPath: function (path) {
            var appPath = capsConfig.applicationPath;

            if (path.startsWith(appPath))
                return path;
            return path.replace(/^~/, function () {
                return appPath === '/' ? '' : appPath;
            });
        }
    };
});