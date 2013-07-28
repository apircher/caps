define(['require', 'knockout', '../module', '../datacontext', 'Q'], function (require, ko, module, datacontext, Q) {

    var currentFileId = ko.observable(0),
        currentFile = ko.observable(),
        isLoading = ko.observable(false);

    var vm = {
        fileId: currentFileId,
        file: currentFile,

        isLoading: isLoading,

        activate: function (fileId) {
            currentFile(null);
            currentFileId(fileId);
            return getFile();
        },

        refresh: function () {

        },

        navigateBack: function () {
            module.router.navigate(module.routeConfig.hash, true);
        }
    };

    function getFile() {
        var deferred = Q.defer();
        isLoading(true);
        datacontext.fetchFile(currentFileId())
            .then(function () {
                currentFile(datacontext.localGetFile(currentFileId()));
                deferred.resolve(currentFile());
            })
            .fail(deferred.fail)
            .done(function () {
                isLoading(false);
            });
        return deferred.promise;
    }

    return vm;

});