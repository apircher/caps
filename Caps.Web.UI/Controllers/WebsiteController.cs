using Caps.Consumer.Model;
using Caps.Data;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.WebApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi.OutputCache.V2;

namespace Caps.Web.UI.Controllers
{
    [Authorize]
    [ValidateJsonAntiForgeryToken]
    [RoutePrefix("api/websites")]
    public class WebsiteController : ApiController
    {
        CapsDbContext db;

        public WebsiteController()
        {
            this.db = new CapsDbContext();
            this.db.Configuration.ProxyCreationEnabled = false;
            this.db.Configuration.LazyLoadingEnabled = false;
        }

        // GET api/websites

        [Route("")]
        [CacheOutput(ServerTimeSpan = 3600, ClientTimeSpan = 0, MustRevalidate = true)]
        public IHttpActionResult GetWebsites()
        {
            var websites = db.Websites.ToList();
            var dtos = websites.Select(w => Dto.Create(w)).ToArray();
            return Ok(dtos);
        }

        // GET api/websites/{websiteId}

        [Route("{websiteId:int}")]
        [CacheOutput(ServerTimeSpan = 3600, ClientTimeSpan = 0, MustRevalidate = true)]
        public IHttpActionResult GetWebsite(int websiteId)
        {
            var website = db.Websites.FirstOrDefault(w => w.Id == websiteId);
            if (website == null)
                return NotFound();

            return Ok(Dto.Create(website));
        }

        // GET api/websites/{websiteId}/sitemap

        [Route("{websiteId:int}/sitemap")]
        [CacheOutput(ServerTimeSpan = 3600, ClientTimeSpan = 0, MustRevalidate = true)]
        public IHttpActionResult GetCurrentSiteMap(int websiteId)
        {
            var siteMap = db.SiteMaps.Include("SiteMapNodes").Include("SiteMapNodes.Resources").Include("SiteMapNodes.Content")
                .Where(m => m.WebsiteId == websiteId && m.PublishedFrom.HasValue && m.PublishedFrom.Value <= DateTime.UtcNow)
                .OrderByDescending(m => m.Version)
                .ThenByDescending(m => m.PublishedFrom)
                .FirstOrDefault();

            return Ok(Dto.Create(siteMap));
        }

        // GET api/websites/{websiteId}/content/{permanentId}

        [Route("{websiteId}/content/{permanentId}")]
        [CacheOutput(ServerTimeSpan = 3600, ClientTimeSpan = 0, MustRevalidate = true)]
        public IHttpActionResult GetContent(int websiteId, int permanentId)
        {
            var currentSiteMap = db.GetCurrentSiteMap(websiteId);
            if (currentSiteMap == null)
                return null;

            var content = db.SiteMapNodes
                .Include("Resources")
                .Include("Content.ContentParts.Resources")
                .Include("Content.Files.Resources.FileVersion.File")
                .FirstOrDefault(n => n.SiteMap.Id == currentSiteMap.Id && n.PermanentId == permanentId);

            if (String.Equals(content.NodeType, "CONTAINER", StringComparison.OrdinalIgnoreCase))
            {
                // Fetch Subnodes.
                var subnodes = db.SiteMapNodes
                    .Include("Resources")
                    .Include("Content.ContentParts.Resources")
                    .Include("Content.Files.Resources.FileVersion.File")
                    .Where(n => n.ParentNodeId == content.Id)
                    .ToList();
            }

            return Ok(Dto.Create(content));
        }

        // GET api/websites/{websiteId}/teasers

        [Route("{websiteId}/teasers")]
        [CacheOutput(ServerTimeSpan = 3600, ClientTimeSpan = 0, MustRevalidate = true)]
        public IHttpActionResult GetTeasers(int websiteId)
        {
            var currentSiteMap = db.GetCurrentSiteMap(websiteId);
            if (currentSiteMap == null)
                return null;
            
            var rootNode = currentSiteMap.SiteMapNodes.FirstOrDefault(n => n.ParentNodeId == null && n.NodeType.ToLower() == "root");
            if (rootNode == null)
                return null;
            
            var teasers = (from node in db.SiteMapNodes
                           join node2 in db.SiteMapNodes on node.Redirect.Trim() equals System.Data.Entity.SqlServer.SqlFunctions.StringConvert((double)node2.PermanentId).Trim()
                           orderby node.Ranking
                           where
                               node.NodeType.ToLower() == "teaser" &&
                               node.SiteMapId == currentSiteMap.Id &&
                               node2.SiteMapId == currentSiteMap.Id &&
                               node.ParentNodeId == rootNode.Id
                           select new
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

            var teaserDtos = teasers.Select(t => new TeaserModel
            {
                Teaser = Dto.Create(t.Teaser),
                TeasedContent = Dto.Create(t.TeasedContent)
            });

            return Ok(teaserDtos);
        }

        // GET api/websites/{websiteId}/fileversions/{fileVersionId}

        [Route("{websiteId}/fileversions/{fileVersionId}")]
        [CacheOutput(ServerTimeSpan = 3600, ClientTimeSpan = 0, MustRevalidate = true)]
        public IHttpActionResult GetContentFileVersion(int websiteId, int fileVersionId)
        {
            var fileVersion = db.FileVersions
                .Include("Content")
                .Include("Thumbnails")
                .Include("File")
                .FirstOrDefault(v => v.Id == fileVersionId);

            return Ok(Dto.Create(fileVersion));
        }

        // GET api/websites/{websiteId}/fileversions/{fileVersionId}/thumbnails/{nameOrSize}

        [Route("{websiteId}/fileversions/{fileVersionId}/thumbnails/{nameOrSize}")]
        [CacheOutput(ServerTimeSpan = 3600, ClientTimeSpan = 0, MustRevalidate = true)]
        public IHttpActionResult GetThumbnail(int websiteId, int fileVersionId, String nameOrSize, String fitMode = "Default")
        {
            var latestVersion = db.FileVersions
                .Include("Content")
                .Include("Thumbnails")
                .Include("File")
                .FirstOrDefault(v => v.Id == fileVersionId);

            if (latestVersion == null)
                return NotFound();

            var file = latestVersion.File;
            if (!file.IsImage) // TODO: Return default document thumbnail...
                return BadRequest("Thumbnails can only be created for images.");

            var thumbnail = latestVersion.GetOrCreateThumbnail(nameOrSize, ConvertToFitMode(fitMode));
            if (thumbnail == null)
                return BadRequest("An error occured while creating the thumbnail.");

            // Save new Thumbnails
            db.SaveChanges();

            return Ok(Dto.Create(thumbnail));
        }

        static Caps.Web.Imaging.ThumbnailFitMode ConvertToFitMode(String s)
        {
            Caps.Web.Imaging.ThumbnailFitMode mode = Caps.Web.Imaging.ThumbnailFitMode.Default;
            if (Enum.TryParse<Caps.Web.Imaging.ThumbnailFitMode>(s, out mode))
                return mode;
            return Caps.Web.Imaging.ThumbnailFitMode.Default;
        }
    }
}
