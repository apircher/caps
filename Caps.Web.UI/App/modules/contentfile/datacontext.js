define([
    'breeze',
    'entityManagerProvider',
    'Q',
    'jquery',
    'knockout',
    'infrastructure/userQueryParser'
],
function (breeze, entityManagerProvider, Q, $, ko, UserQueryParser) {

    var manager = entityManagerProvider.createManager();
    var EntityQuery = breeze.EntityQuery;
    var parser = new UserQueryParser();

    parser.translateColumnName = function (col) {
        if (col && col.length) {
            if (/autor/i.test(col)) return 'Created.By';
        }
        return 'FileName';
    };

    function getFiles() {
        var query = EntityQuery.from('Files');
        return manager.executeQuery(query);
    }

    function searchFiles(searchWords, pageNumber, itemsPerPage, orderBy, filters) {
        var src = filters ? EntityQuery.from('FilteredFiles').withParameters({ filterOptions: filters }) : EntityQuery.from('Files');

        var query = filterQuery(src, searchWords)
            .orderBy(orderBy || 'Created.At desc')
            .skip((pageNumber - 1) * itemsPerPage)
            .take(itemsPerPage)
            .inlineCount(true);
        return manager.executeQuery(query);
    }

    function filterQuery(query, searchWords) {
        if (searchWords && searchWords.length) {
            var p = parser.getBreezePredicate(searchWords);
            if (p) return query.where(p);
        }
        return query;
    }

    function fetchFile(id) {
        var query = EntityQuery.from('Files').where('Id', '==', id)
            .expand('Tags.Tag, Versions, Versions.Properties');
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

    function addFileTag(fileEntity, tagEntity) {
        var deferred = Q.defer(),
            tagQuery = EntityQuery.from('Tags').where('Id', '==', tagEntity.Id());

        manager.executeQuery(tagQuery)
            .then(function (data) {
                var tag = data.results[0],
                    fileTagEntity = manager.createEntity('DbFileTag', { FileId: fileEntity.Id(), TagId: tag.Id() });
                manager.addEntity(fileTagEntity);
                manager.saveChanges().fail(deferred.reject).done(deferred.resolve);
            })
            .fail(deferred.reject);

        return deferred.promise;
    }

    function removeFileTag(fileEntity, fileTagEntity) {
        fileEntity.Tags.remove(fileTagEntity);
        fileTagEntity.entityAspect.setDeleted();
        return manager.saveChanges();
    }

    return {
        getFiles: getFiles,
        fetchFile: fetchFile,
        localGetFile: localGetFile,
        deleteFile: deleteFile,
        searchFiles: searchFiles,
        addFileTag: addFileTag,
        removeFileTag: removeFileTag,
        isValidUserQuery: function (searchWords) {
            return parser.validate(searchWords);
        }
    };

});