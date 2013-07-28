define(['breeze', 'entityManagerProvider', 'Q', 'jquery'], function (breeze, entityManagerProvider, Q, $) {

    var manager = entityManagerProvider.createManager();

    function getFiles() {
        var query = new breeze.EntityQuery().from('Files');
        return manager.executeQuery(query);
    }

    function fetchFile(id) {
        var deferred = Q.defer();
        manager.fetchEntityByKey('DbFile', id, false)
            .then(function (result) {
                var entity = result.entity;
                entity.entityAspect.loadNavigationProperty('Versions')
                    .then(function () {
                        deferred.resolve(entity);
                    })
                    .fail(deferred.reject);
            })
            .fail(deferred.reject);
        return deferred.promise;
    }

    function localGetFile(id) {
        return manager.getEntityByKey('DbFile', id);
    }

    function deleteFile(entity) {
        var deferred = Q.defer();
        $.ajax('api/DbFile/' + entity.Id(), { method: 'delete' }).done(deleteSucceeded).fail(deferred.reject);

        function deleteSucceeded() {
            manager.detachEntity(entity);
            deferred.resolve();
        }

        return deferred.promise;
    }

    return {
        getFiles: getFiles,
        fetchFile: fetchFile,
        localGetFile: localGetFile,
        deleteFile: deleteFile
    };

});