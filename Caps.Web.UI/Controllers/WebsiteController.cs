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

namespace Caps.Web.UI.Controllers
{
    [Authorize]
    [SetUserActivity]
    [ValidateJsonAntiForgeryToken]
    [RoutePrefix("api/websites")]
    public class WebsiteController : ApiController
    {
        CapsDbContext db;

        public WebsiteController(CapsDbContext db)
        {
            this.db = db;
        }

        // GET api/websites

        [Route("")]
        public IHttpActionResult GetWebsites()
        {
            var websites = db.Websites.ToList();
            var dtos = websites.Select(w => Dto.Create(w)).ToArray();
            return Ok(dtos);
        }

        // GET api/websites/{websiteId}

        [Route("{websiteId:int}")]
        public IHttpActionResult GetWebsite(int websiteId)
        {
            var website = db.Websites.FirstOrDefault(w => w.Id == websiteId);
            if (website == null)
                return NotFound();

            return Ok(Dto.Create(website));
        }

        // GET api/websites/{websiteId}/sitemap

        [Route("{websiteId:int}/sitemap")]
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

            return Ok(Dto.Create(content));
        }

        // GET api/websites/{websiteId}/fileversions/{fileVersionId}

        [Route("{websiteId}/fileversions/{fileVersionId}")]
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
        public IHttpActionResult GetThumbnail(int websiteId, int fileVersionId, String nameOrSize)
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

            var thumbnail = latestVersion.GetOrCreateThumbnail(nameOrSize);
            if (thumbnail == null)
                return BadRequest("An error occured while creating the thumbnail.");

            // Save new Thumbnails
            db.SaveChanges();

            return Ok(Dto.Create(thumbnail));
        }
    }
}
