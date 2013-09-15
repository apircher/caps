define(['require', 'knockout', '../module', '../datacontext', 'Q', 'moment', 'infrastructure/utils', 'infrastructure/tagService'], function (require, ko, module, datacontext, Q, moment, utils, tagService) {

    var app = require('durandal/app'),
        currentFileId = ko.observable(0),
        currentFile = ko.observable(),
        isLoading = ko.observable(false),
        tagName = ko.observable();

    var vm = {
        fileId: currentFileId,
        file: currentFile,

        isLoading: isLoading,

        activate: function (fileId) {
            currentFile(null);
            currentFileId(fileId);
            return getFile()
                .fail(function (err) {
                    alert(err.message);
                });
        },

        refresh: function () {
            return getFile();
        },

        navigateBack: function () {
            module.router.navigate(module.routeConfig.hash);
        },

        previewTemplate: function (file) {
            if (file && file.isImage()) return 'file-preview-image';
            return 'file-preview-general';
        },

        tagName: tagName,
        addTag: function () {
            var tn = tagName();
            if (tn && tn.length) {
                tagService.getOrCreateTag(tn)
                    .then(function (data) {
                        return datacontext.addFileTag(currentFile(), data);
                    })
                    .fail(function (err) {
                        window.alert(err.message || err.responseText);
                    })
                    .done(function () {
                        app.trigger('caps:tag:added', tagName());
                        tagName('');
                    });
            }
        },
        removeTag: function (tag) {
            datacontext.removeFileTag(currentFileId(), tag.Tag().Name()).fail(function () { alert(err.message || err.responseText); }).done(vm.refresh);
        },

        moment: moment,
        utils: utils
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