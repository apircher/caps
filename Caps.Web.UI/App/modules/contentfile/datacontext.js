define(['breeze', 'entityManagerProvider', 'Q', 'jquery', 'knockout'], function (breeze, entityManagerProvider, Q, $, ko) {

    var manager = entityManagerProvider.createManager();
    var EntityQuery = breeze.EntityQuery;

    function getFiles() {
        var query = EntityQuery.from('Files');
        return manager.executeQuery(query);
    }

    function searchFiles(pageNumber, itemsPerPage, filters) {
        var query = filterQuery(EntityQuery.from('Files'), filters)
            .orderBy('Created.At desc')
            .skip((pageNumber - 1) * itemsPerPage)
            .take(itemsPerPage)
            .inlineCount(true);
        return manager.executeQuery(query);
    }

    function filterQuery(query, filters) {
        if (filters && filters.length) {
            var predicates = ko.utils.arrayMap(filters, function (f) {
                return new breeze.Predicate(f.col, f.operator || 'contains', f.val);
            });
            return query.where(breeze.Predicate.and(predicates));
        }
        return query;
    }

    function fetchFile(id) {
        var query = EntityQuery.from('Files').where('Id', '==', id)
            .expand('Versions, Versions.Properties');
        return manager.executeQuery(query);
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
        deleteFile: deleteFile,
        searchFiles: searchFiles
    };

});