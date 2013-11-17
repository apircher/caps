﻿define([
    'durandal/system',
    'breeze',
    'entityManagerProvider',
    'jquery',
    'infrastructure/userQueryParser'
],
function (system, breeze, entityManagerProvider, $, UserQueryParser) {

    var manager = entityManagerProvider.createManager(),
        EntityQuery = breeze.EntityQuery;

    // Create grammer parser for searches.
    var parser = new UserQueryParser();
    parser.translateColumnName = function (col) {
        if (col && col.length) {
            if (/autor/i.test(col)) return 'Created.By';
        }
        return 'FileName';
    };

    // Fetch all DbFile-Entities.
    function getFiles() {
        var query = EntityQuery.from('Files');
        return manager.executeQuery(query);
    }

    // Search DbFile-Entities.
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

    // Fetch a single DbFile-Entity.
    function fetchFile(id) {
        var query = EntityQuery.from('Files').where('Id', '==', id)
            .expand('Tags.Tag, Versions, Versions.Properties');
        return manager.executeQuery(query);
    }

    // Fetch a single DbFile-Entity from local cache.
    function localGetFile(id) {
        return manager.getEntityByKey('DbFile', id);
    }

    // Delete a DbFile-Entity.
    function deleteFile(entity) {
        return system.defer(function (dfd) {
            $.ajax('api/DbFile/' + entity.Id(), { method: 'delete' }).done(deleteSucceeded).fail(dfd.reject);

            function deleteSucceeded() {
                manager.detachEntity(entity);
                dfd.resolve();
            }
        })
        .promise();
    }

    // Create a DbFileTag-Entity.
    function addFileTag(fileEntity, tagEntity) {
        return system.defer(function (dfd) {
            var tagQuery = EntityQuery.from('Tags').where('Id', '==', tagEntity.Id());
            manager.executeQuery(tagQuery)
                .then(function (data) {
                    var tag = data.results[0],
                        fileTagEntity = manager.createEntity('DbFileTag', { FileId: fileEntity.Id(), TagId: tag.Id() });
                    manager.addEntity(fileTagEntity);
                    manager.saveChanges().fail(dfd.reject).done(dfd.resolve);
                })
                .fail(dfd.reject);
        })
        .promise();
    }

    // Delete a DbFileTag-Entity.
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