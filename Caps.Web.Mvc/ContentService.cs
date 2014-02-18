using Caps.Data;
using Caps.Data.ContentControls;
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
    /// <summary>
    /// Provides an interface for websites to retrieve content.
    /// </summary>
    public class ContentService
    {
        CapsDbContext db;

        /// <summary>
        /// Creates a new instance of the ContentService class.
        /// </summary>
        /// <param name="db"></param>
        public ContentService(CapsDbContext db) 
        {
            this.db = db;
        }

        /// <summary>
        /// Returns the currently published version of the sitemap 
        /// node with the given permanent id.
        /// </summary>
        /// <param name="permanentId"></param>
        /// <returns></returns>
        public Caps.Data.Model.DbSiteMapNode GetCurrentNodeVersion(int permanentId) 
        {
            var currentSiteMap = db.GetCurrentSiteMap(db.Websites.First().Id);
            if (currentSiteMap == null)
                return null;

            return db.SiteMapNodes
                .Include("Resources")
                .Include("Content.ContentParts.Resources")
                .Include("Content.Files.Resources.FileVersion.File")
                .FirstOrDefault(n => n.SiteMap.Id == currentSiteMap.Id && n.PermanentId == permanentId);
        }

        /// <summary>
        /// Returns a localized ContentModel-Instance for the sitemap node with the given 
        /// permanent id and the language set by Caps.Data.Localization.Language.CurrentLanguage.
        /// </summary>
        /// <param name="permanentId"></param>
        /// <returns></returns>
        public ContentModel GetContent(int permanentId, ContentScriptManager scriptManager = null) 
        {
            var entity = GetCurrentNodeVersion(permanentId);
            if (entity == null)
                throw new ContentNotFoundException();

            var contentParts = entity.Content != null ? entity.Content.ContentParts.Select(p =>
                p.GetValueForLanguage(Language.CurrentLanguage, r => {
                    if (String.IsNullOrWhiteSpace(r.Content))
                        return null;

                    return new ContentPartModel
                    {
                        Content = r.Content,
                        Language = r.Language,
                        Usage = p.Name,
                        IsFallback = !String.Equals(Language.CurrentLanguage, r.Language, StringComparison.OrdinalIgnoreCase)
                    };
                }
                , null, "de", "en")) : new List<ContentPartModel>();

            var contentFiles = entity.Content != null ? entity.Content.Files.Select(f =>
                f.GetValueForLanguage(Language.CurrentLanguage, r => new ContentFileModel
                {
                    Name = f.Name,
                    Language = r.Language,
                    Determination = f.Determination,
                    Group = f.Group,
                    Ranking = f.Ranking,
                    Title = LocalizedFileTitle(f, r.Language),
                    Description = r.Description,
                    FileVersionId = r.DbFileVersionId.GetValueOrDefault(),
                    FileName = r.FileVersion != null ? r.FileVersion.File.FileName : String.Empty
                }
                , null, "de", "en")) : new List<ContentFileModel>();

            var result = new ContentModel(scriptManager ?? new ContentScriptManager())
            {
                SiteMapNode = entity,
                ContentParts = contentParts.Where(c => c != null),
                ContentFiles = contentFiles.Where(f => f != null)
            };

            return result;
        }

        String LocalizedFileTitle(Caps.Data.Model.PublicationFile f, String language) {
            var result = f.GetValueForLanguage(language, r => r.Title, "de", "en");
            if (String.IsNullOrWhiteSpace(result))
            {
                var v = f.FileVersionForLanguage(language, "de", "en");
                if (v != null) result = v.File.FileName;
            }
            return String.IsNullOrWhiteSpace(result) ? String.Empty : result;
        }

        /// <summary>
        /// Returns an IEnumerable of TeaserModel-Instances for the 
        /// Teasers placed on the websites start page.
        /// </summary>
        /// <returns></returns>
        public IEnumerable<TeaserModel> GetTeasers()
        {
            var currentSiteMap = db.GetCurrentSiteMap(db.Websites.First().Id);
            if (currentSiteMap == null)
                return null;

            var rootNode = currentSiteMap.SiteMapNodes.FirstOrDefault(n => n.ParentNodeId == null && n.NodeType.ToLower() == "root");
            if (rootNode == null)
                return null;

            var teasers = (from node in db.SiteMapNodes
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
                          })
                          .ToList();

            var publicationIds = teasers.Select(t => t.TeasedContent.ContentId)
                .Union(teasers.Select(t => t.Teaser.ContentId))
                .Distinct()
                .ToList();

            var publications = db.Publications
                .Include("ContentParts.Resources")
                .Include("Files.Resources.FileVersion.File")
                .Where(p => publicationIds.Contains(p.Id)).ToList();
            
            return teasers;
        }
    }

    public class ContentNotFoundException : Exception
    {
    }
}
