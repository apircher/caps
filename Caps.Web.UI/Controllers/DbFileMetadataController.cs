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
    public class DbFileMetadataController : Controller
    {
        CapsDbContext db;

        public DbFileMetadataController(CapsDbContext db)
        {
            this.db = db;
        }

        //
        // GET: /DbFileMetadata/
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public JsonResult GetFileInfo(List<String> fileNames)
        {
            List<object> result = new List<object>();
            Array.ForEach(fileNames.ToArray(), fileName =>
            {
                var query = db.Files.Where(f => f.FileName.ToLower() == fileName.ToLower());
                result.Add(new { FileName = fileName, Count = query.Count() });
            });
            return Json(result.ToArray());
        }
	}
}