using Caps.Data;
using Caps.Web.UI.Infrastructure.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Caps.Web.UI.Controllers
{
    [Authorize, SetUserActivity, ValidateJsonAntiForgeryToken]
    public class DbSiteMapNodeController : Controller
    {
        CapsDbContext db;

        public DbSiteMapNodeController(CapsDbContext db)
        {
            this.db = db;
        }

        //
        // GET: /DbSiteMapNode/
        public ActionResult NextPermanentId()
        {
            var maxPermanentId = db.SiteMapNodes.Select(n => n.PermanentId).Max();
            return Json(maxPermanentId + 1);
        }
	}
}