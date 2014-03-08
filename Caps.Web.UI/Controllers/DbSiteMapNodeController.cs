using Caps.Data;
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
    [RoutePrefix("api/sitemapnode")]
    public class DbSiteMapNodeController : ApiController
    {
        CapsDbContext db;

        public DbSiteMapNodeController(CapsDbContext db)
        {
            this.db = db;
        }

        // GET api/sitemapnode/nextpermanentid

        [Route("nextpermanentid")]
        public int GetNextPermanentId()
        {
            var maxPermanentId = db.SiteMapNodes.Select(n => n.PermanentId).Max();
            return maxPermanentId + 1;
        }
    }
}
