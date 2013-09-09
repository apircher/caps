﻿define(['breeze', 'entityManagerProvider', 'Q', 'jquery', 'knockout', './searchGrammerModule'], function (breeze, entityManagerProvider, Q, $, ko, searchGrammer) {

    var manager = entityManagerProvider.createManager();
    var EntityQuery = breeze.EntityQuery;

    function getFiles() {
        var query = EntityQuery.from('Files');
        return manager.executeQuery(query);
    }

    function searchFiles(searchWords, pageNumber, itemsPerPage) {
        var query = filterQuery(EntityQuery.from('Files'), searchWords)
            .orderBy('Created.At desc')
            .skip((pageNumber - 1) * itemsPerPage)
            .take(itemsPerPage)
            .inlineCount(true);
        return manager.executeQuery(query);
    }

    function filterQuery(query, searchWords) {
        if (searchWords && searchWords.length) {
            var ast = searchGrammer.parseUserQuery(searchWords);
            if (ast) {
                var predicates = ast.getPredicates();
                if (predicates) return query.where(predicates);
            }            
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
        searchFiles: searchFiles,
        isValidUserQuery: function (searchWords) {
            return searchGrammer.isValidUserQuery(searchWords);
        }
    };

});