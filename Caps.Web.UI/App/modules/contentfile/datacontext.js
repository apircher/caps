define(['breeze', 'entityManagerProvider', 'Q', 'jquery'], function (breeze, entityManagerProvider, Q, $) {

    var manager = entityManagerProvider.createManager();

    function getFiles() {
        var query = new breeze.EntityQuery().from('Files');
        return manager.executeQuery(query);
    }

    function fetchFile(id) {
        return manager.fetchEntityByKey('DbFile', id, false);
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