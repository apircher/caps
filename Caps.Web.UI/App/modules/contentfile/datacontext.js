define([
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

        var query = filterQuery(src, searchWords).expand('Versions')
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
            .expand('Tags.Tag, Versions.Properties, Versions.DraftFileResources.DraftFile, Versions.PublicationFileResources.PublicationFile');
        return manager.executeQuery(query);
    }

    function getThumbnailInfo(fileVersionId) {
        return system.defer(function (dfd) {
            $.ajax('api/dbfileversion/' + fileVersionId + '/thumbnails', { method: 'get' }).done(getSucceeded).fail(dfd.reject);

            function getSucceeded(data) {
                dfd.resolve(data);
            }
        })
        .promise();
    }

    function deleteThumbnail(fileVersionId, thumbnailId) {
        return system.defer(function (dfd) {
            $.ajax('api/dbfileVersion/' + fileVersionId + '/thumbnail/' + thumbnailId, { method: 'delete' })
                .done(dfd.resolve)
                .fail(dfd.reject);
        })
        .promise();
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

    // Delete a DbFileVersion-Entity.
    function deleteFileVersion(entity) {
        return system.defer(function (dfd) {
            $.ajax('api/DbFileVersion/' + entity.Id(), { method: 'delete' }).done(deleteSucceeded).fail(dfd.reject);

            function deleteSucceeded() {
                try {
                    manager.detachEntity(entity);
                }
                catch (error) {
                    system.log(error);
                }
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

    function detachEntity(entity) {
        manager.detachEntity(entity);
    }

    function detachDraftFileResources(entity) {
        var resources = manager.getEntities('DraftFileResource');
        resources.forEach(function (r) {
            if (r.DraftFile() && r.DraftFile().DraftId() == entity.Id()) {
                manager.detachEntity(r);
            }
        });
    }

    function detachPublicationFileResources(publicationId) {
        var resources = manager.getEntities('PublicationFileResource');
        resources.forEach(function (r) {
            if (r.PublicationFile() && r.PublicationFile().PublicationId() == publicationId) {
                manager.detachEntity(r);
            }
        });
    }

    function detachDraftFile(entity) {
        var query = new EntityQuery().from('DraftFiles').where('Id', '==', entity.Id());
        var results = manager.executeQueryLocally(query);
        if (results && results.length) {
            results.forEach(function (r) {
                if (r.Resources()) r.Resources().forEach(function (res) { manager.detachEntity(res); });
                manager.detachEntity(r);
            });
        }
    }

    function getFileInfo(fileNames) {
        return system.defer(function (dfd) {
            $.ajax('api/dbfile/metadata', { method: 'post', dataType: 'json', data: { '': fileNames } }).done(getSucceeded).fail(dfd.reject);

            function getSucceeded(result) {
                
                dfd.resolve(result);
            }
        })
        .promise();
    }


    return {
        getFiles: getFiles,
        fetchFile: fetchFile,
        localGetFile: localGetFile,
        deleteFile: deleteFile,
        deleteFileVersion: deleteFileVersion,
        searchFiles: searchFiles,
        addFileTag: addFileTag,
        removeFileTag: removeFileTag,
        detachEntity: detachEntity,
        detachPublicationFileResources: detachPublicationFileResources,
        detachDraftFileResources: detachDraftFileResources,
        detachDraftFile: detachDraftFile,
        getFileInfo: getFileInfo,
        getThumbnailInfo: getThumbnailInfo,
        deleteThumbnail: deleteThumbnail,

        isValidUserQuery: function (searchWords) {
            return parser.validate(searchWords);
        }
    };

});