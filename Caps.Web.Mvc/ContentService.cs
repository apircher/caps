using Caps.Data;
using Caps.Data.Localization;
using Caps.Web.Mvc.Model;
using System;
using System.Collections.Generic;
using System.Data.Entity.SqlServer;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc
{
    public class ContentService
    {
        CapsDbContext db;

        public ContentService(CapsDbContext db)
        {
            this.db = db;
        }

        public ContentModel GetContentById(int id)
        {
            var currentSiteMap = db.GetCurrentSiteMap(db.Websites.First().Id);
            if (currentSiteMap == null)
                throw new ContentNotFoundException();

            var entity = db.SiteMapNodes
                .Include("Resources")
                .Include("Content.ContentParts.Resources")
                .Include("Content.Files.Resources.FileVersion.File")
                .FirstOrDefault(n => n.SiteMap.Id == currentSiteMap.Id && n.PermanentId == id);

            if (entity == null)
                throw new ContentNotFoundException();

            var contentParts = entity.Content.ContentParts.Select(p =>
                p.GetValueForLanguage(Language.CurrentLanguage, r => new ContentPartModel
                {
                    Content = r.Content,
                    Language = r.Language,
                    Usage = p.PartType,
                    IsFallback = !String.Equals(Language.CurrentLanguage, r.Language, StringComparison.OrdinalIgnoreCase)
                }
                , null, "de", "en"));

            return new ContentModel
            {
                SiteMapNode = entity,
                ContentParts = contentParts
            };
        }

        public IEnumerable<TeaserModel> GetTeasers()
        {
            var currentSiteMap = db.GetCurrentSiteMap(db.Websites.First().Id);
            if (currentSiteMap == null)
                return null;

            var rootNode = currentSiteMap.SiteMapNodes.FirstOrDefault(n => n.ParentNodeId == null && n.NodeType.ToLower() == "root");
            if (rootNode == null)
                return null;

            var teasers = from node in db.SiteMapNodes
                          join node2 in db.SiteMapNodes on node.Redirect.Trim() equals SqlFunctions.StringConvert((double)node2.PermanentId).Trim()
                          orderby node.Ranking
                          where
                              node.NodeType.ToLower() == "teaser" &&
                              node.SiteMapId == currentSiteMap.Id &&
                              node2.SiteMapId == currentSiteMap.Id &&
                              node.ParentNodeId == rootNode.Id
                          select new TeaserModel
                          {
                              Teaser = node,
                              TeasedContent = node2
                          };

            return teasers.ToList();
        }
    }

    public class ContentNotFoundException : Exception
    {
    }
}
