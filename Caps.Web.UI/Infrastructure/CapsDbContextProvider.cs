using Breeze.WebApi;
using Breeze.WebApi.EF;
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

            if (saveMap.ContainsKey(typeof(Draft)))
            {
                var newDrafts = saveMap[typeof(Draft)].Where(n => n.EntityState == EntityState.Added);
                foreach (var entry in newDrafts)
                {
                    var draft = entry.Entity as Draft;
                    draft.Created.By = user.Identity.Name;
                    draft.Created.At = DateTime.Now;
                    draft.Modified.By = user.Identity.Name;
                    draft.Modified.At = DateTime.Now;
                }
            }

            return saveMap;
        }
    }
}