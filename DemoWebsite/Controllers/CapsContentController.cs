using Caps.Data;
using Caps.Data.Model;
using Caps.Web.Mvc;
using Caps.Web.Mvc.Attributes;
using Caps.Web.Mvc.Imaging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace DemoWebsite.Controllers
{
    [SetCulture]
    public class CapsContentController : Controller
    {
        //
        // GET: /CapsContent/
        public ActionResult Index(String id, String language)
        {
            int idValue;
            if (!int.TryParse(id, System.Globalization.NumberStyles.HexNumber, System.Globalization.CultureInfo.InvariantCulture, out idValue))
                return HttpNotFound();

            var caps = DependencyResolver.Current.GetService<ContentService>();
            var content = caps.GetContent(idValue);
            ViewBag.Content = content;

            if (!String.IsNullOrWhiteSpace(content.TemplateName) && ViewExists(content.TemplateName))
                return View(content.TemplateName);

            return View();
        }

        public ActionResult ContentFile(int id, String name, bool inline)
        {
            var db = DependencyResolver.Current.GetService<CapsDbContext>();
            var fileVersion = GetFileVersion(id, db);
            if (fileVersion == null)
                return HttpNotFound();

            var file = fileVersion.File;
            if (file == null || !String.Equals(name, file.FileName, StringComparison.OrdinalIgnoreCase))
                return HttpNotFound();

            if (inline)
            {
                Response.AddHeader("Content-Disposition", "inline; filename=" + file.FileName);
                return new FileContentResult(fileVersion.Content.Data, file.ContentType);
            }
            else
                return new FileContentResult(fileVersion.Content.Data, file.ContentType) { FileDownloadName = file.FileName };
        }

        public ActionResult Thumbnail(int id, String name, String size)
        {
            var db = DependencyResolver.Current.GetService<CapsDbContext>();
            var latestVersion = GetFileVersion(id, db);
            if (latestVersion == null)
                return HttpNotFound();

            var file = latestVersion.File;
            if (!file.IsImage) // TODO: Return default document thumbnail...
                throw new HttpException("Thumbnails can only be created for images.");

            var thumbnail = latestVersion.GetOrCreateThumbnail(size);
            if (thumbnail == null)
                throw new HttpException("An error occured while creating the thumbnail.");

            // Save new Thumbnails
            db.SaveChanges();

            return new FileContentResult(thumbnail.Data, thumbnail.ContentType);
        }

        private bool ViewExists(string name)
        {
            ViewEngineResult result = ViewEngines.Engines.FindView(ControllerContext, name, null);
            return (result.View != null);
        }
                
        DbFileVersion GetFileVersion(int fileVersionId, CapsDbContext db)
        {
            return db.FileVersions
                .Include("Content")
                .Include("Thumbnails")
                .Include("File")
                .FirstOrDefault(v => v.Id == fileVersionId);
        }
	}
}