using Breeze.ContextProvider;
using Breeze.ContextProvider.EF6;
using Caps.Data;
using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Caps.Web.UI.Infrastructure
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
            ProcessNewOrModifiedSitemapNodes(saveMap);

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
            if (saveMap.ContainsKey(typeof(DraftContentPartResource)))
            {
                var newResources = saveMap[typeof(DraftContentPartResource)].Where(n => n.EntityState == EntityState.Added);
                foreach (var entry in newResources)
                {
                    var resource = entry.Entity as DraftContentPartResource;
                    resource.Created.By = user.Identity.Name;
                    resource.Created.At = DateTime.UtcNow;
                    resource.Modified.By = user.Identity.Name;
                    resource.Modified.At = DateTime.UtcNow;
                }

                var modifiedResources = saveMap[typeof(DraftContentPartResource)].Where(n => n.EntityState == EntityState.Modified);
                foreach (var entry in modifiedResources)
                {
                    var resource = entry.Entity as DraftContentPartResource;
                    resource.Modified.By = user.Identity.Name;
                    resource.Modified.At = DateTime.UtcNow;
                }
            }

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
        }

        void ProcessNewOrModifiedSitemapNodes(Dictionary<Type, List<EntityInfo>> saveMap)
        {
            if (saveMap.ContainsKey(typeof(DbSiteMapNode)))
            {
                var newSitemapNodes = saveMap[typeof(DbSiteMapNode)].Where(n => n.EntityState == EntityState.Added);
                foreach (var entry in newSitemapNodes)
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
    }
}