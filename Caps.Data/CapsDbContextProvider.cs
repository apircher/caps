using Breeze.ContextProvider;
using Breeze.ContextProvider.EF6;
using Caps.Data;
using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Caps.Data
{
    public class CapsDbContextProvider : EFContextProvider<CapsDbContext>
    {
        System.Security.Principal.IPrincipal user;
        public CapsDbContextProvider(System.Security.Principal.IPrincipal user)
        {
            this.user = user;
        }

        protected override Dictionary<Type, List<EntityInfo>> BeforeSaveEntities(Dictionary<Type, List<EntityInfo>> saveMap)
        {
            ProcessNewOrModifiedDbFileTags(saveMap);
            ProcessNewOrModifiedDrafts(saveMap);
            ProcessNewOrModifiedSiteMapNodes(saveMap);

            ProcessDeletedSiteMapNodes(saveMap);

            return saveMap;
        }
        
        void ProcessNewOrModifiedDbFileTags(Dictionary<Type, List<EntityInfo>> saveMap)
        {
            if (saveMap.ContainsKey(typeof(DbFileTag)))
            {
                var deletedFileTagEntityInfos = saveMap[typeof(DbFileTag)].Where(n => n.EntityState == EntityState.Deleted).ToList();
                if (deletedFileTagEntityInfos.Count > 0)
                {
                    var fileTags = deletedFileTagEntityInfos.Select(d => d.Entity).Cast<DbFileTag>().ToList();
                    foreach (var fileTag in fileTags)
                    {
                        if (!Context.FileTags.Any(ft => ft.TagId == fileTag.TagId && ft.FileId != fileTag.FileId))
                        {
                            var tag = Context.Tags.FirstOrDefault(t => t.Id == fileTag.TagId);
                            var tagEntityInfo = CreateEntityInfo(fileTag.Tag, EntityState.Deleted);
                            var tagType = typeof(Tag);
                            if (!saveMap.ContainsKey(tagType))
                                saveMap.Add(tagType, new List<EntityInfo>());
                            saveMap[tagType].Add(CreateEntityInfo(tag, EntityState.Deleted));
                        }
                    }
                }
            }
        }
        void ProcessNewOrModifiedDrafts(Dictionary<Type, List<EntityInfo>> saveMap)
        {
            if (saveMap.ContainsKey(typeof(Draft)))
            {
                var newDrafts = saveMap[typeof(Draft)].Where(n => n.EntityState == EntityState.Added);
                foreach (var entry in newDrafts)
                {
                    var draft = entry.Entity as Draft;
                    draft.Created.By = user.Identity.Name;
                    draft.Created.At = DateTime.UtcNow;
                    draft.Modified.By = user.Identity.Name;
                    draft.Modified.At = DateTime.UtcNow;
                }

                var modifiedDrafts = saveMap[typeof(Draft)].Where(n => n.EntityState == EntityState.Modified);
                foreach (var entry in modifiedDrafts)
                {
                    entry.ForceUpdate = true;

                    var draft = entry.Entity as Draft;
                    draft.Modified.By = user.Identity.Name;
                    draft.Modified.At = DateTime.UtcNow;
                    draft.Version++;
                }
            }

            if (saveMap.ContainsKey(typeof(DraftTranslation)))
            {
                var newTranslations = saveMap[typeof(DraftTranslation)].Where(n => n.EntityState == EntityState.Added);
                foreach (var entry in newTranslations)
                {
                    var translation = entry.Entity as DraftTranslation;
                    translation.Created.By = user.Identity.Name;
                    translation.Created.At = DateTime.UtcNow;
                    translation.Modified.By = user.Identity.Name;
                    translation.Modified.At = DateTime.UtcNow;
                }

                var modifiedTranslations = saveMap[typeof(DraftTranslation)].Where(n => n.EntityState == EntityState.Modified);
                foreach (var entry in modifiedTranslations)
                {
                    entry.ForceUpdate = true;

                    var translation = entry.Entity as DraftTranslation;
                    translation.Modified.By = user.Identity.Name;
                    translation.Modified.At = DateTime.UtcNow;
                }
            }
        }

        void ProcessNewOrModifiedSiteMapNodes(Dictionary<Type, List<EntityInfo>> saveMap)
        {
            if (saveMap.ContainsKey(typeof(DbSiteMapNode)))
            {
                var newSiteMapNodes = saveMap[typeof(DbSiteMapNode)].Where(n => n.EntityState == EntityState.Added);
                foreach (var entry in newSiteMapNodes)
                {
                    var sitemapNode = entry.Entity as DbSiteMapNode;
                    sitemapNode.Created.At = DateTime.UtcNow;
                    sitemapNode.Created.By = user.Identity.Name;
                    sitemapNode.Modified.At = DateTime.UtcNow;
                    sitemapNode.Modified.By = user.Identity.Name;

                    // Ensure a unique PermanentId.
                    if (sitemapNode.PermanentId == 0 || Context.SiteMapNodes.Any(n => n.SiteMapId == sitemapNode.SiteMapId && n.PermanentId == sitemapNode.PermanentId))
                        sitemapNode.PermanentId = Context.SiteMapNodes.Select(n => (int?)n.PermanentId).Max().GetValueOrDefault() + 1;
                }

                var modifiedNodes = saveMap[typeof(DbSiteMapNode)].Where(n => n.EntityState == EntityState.Modified);
                foreach (var entry in modifiedNodes)
                {
                    var sitemapNode = entry.Entity as DbSiteMapNode;
                    sitemapNode.Modified.At = DateTime.UtcNow;
                    sitemapNode.Modified.By = user.Identity.Name;
                }
            }
        }
        void ProcessDeletedSiteMapNodes(Dictionary<Type, List<EntityInfo>> saveMap)
        {
            if (saveMap.ContainsKey(typeof(DbSiteMapNode)))
            {
                var deletedSiteMapNodes = saveMap[typeof(DbSiteMapNode)].Where(n => n.EntityState == EntityState.Deleted);

                foreach (var node in deletedSiteMapNodes.Select(nfo => nfo.Entity).Cast<DbSiteMapNode>())
                {
                    if (!node.ContentId.HasValue) continue;
                    if (!Context.SiteMapNodes.Any(n => n.ContentId == node.ContentId && n.Id != node.Id))
                        AddPublicationForDeletion(node.ContentId, saveMap);
                }
            }
        }


        void AddPublicationForDeletion(int? id, Dictionary<Type, List<EntityInfo>> saveMap)
        {
            if (!id.HasValue)
                return;

            var key = id.GetValueOrDefault();
            var publication = Context.Publications
                .Include("Files.Resources")
                .Include("ContentParts.Resources")
                .FirstOrDefault(p => p.Id == key);
            if (publication == null) return;

            AddEntityInfo(saveMap, publication, EntityState.Deleted);
            Array.ForEach(publication.Files.ToArray(), f =>
            {
                AddEntityInfo(saveMap, f, EntityState.Deleted);
                Array.ForEach(f.Resources.ToArray(), r => AddEntityInfo(saveMap, r, EntityState.Deleted));
            });

            Array.ForEach(publication.ContentParts.ToArray(), cp =>
            {
                AddEntityInfo(saveMap, cp, EntityState.Deleted);
                Array.ForEach(cp.Resources.ToArray(), r => AddEntityInfo(saveMap, r, EntityState.Deleted));
            });
        }

        void AddEntityInfo<T>(Dictionary<Type, List<EntityInfo>> saveMap, T entity, EntityState state)
        {
            var nfo = CreateEntityInfo(entity, EntityState.Deleted);
            var t = entity.GetType();
            if (!saveMap.ContainsKey(t)) saveMap.Add(t, new List<EntityInfo>());
            saveMap[t].Add(nfo);
        }
    }
}