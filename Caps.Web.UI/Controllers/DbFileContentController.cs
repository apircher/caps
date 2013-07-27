using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Caps.Web.UI.Controllers
{
    [Authorize, SetUserActivity]
    public class DbFileContentController : Controller
    {
        CapsDbContext db;

        public DbFileContentController(CapsDbContext db)
        {
            this.db = db;
        }

        public ActionResult Inline(int id)
        {
            var latestVersion = GetLatestVersion(id);
            if (latestVersion == null)
                return HttpNotFound();
            return File(latestVersion.Content.Data, latestVersion.File.ContentType);
        }

        public ActionResult Download(int id)
        {
            var latestVersion = GetLatestVersion(id);
            if (latestVersion == null)
                return HttpNotFound();
            var file = latestVersion.File;
            return File(latestVersion.Content.Data, file.ContentType, file.FileName);
        }

        public ActionResult Thumbnail(int id, String thumbnailName)
        {
            var latestVersion = GetLatestVersion(id);
            if (latestVersion == null)
                return HttpNotFound();

            var file = latestVersion.File;
            if (!file.IsImage) // TODO: Return default document thumbnail...
                throw new HttpException("Thumbnails can only be created for images.");

            var thumbnail = latestVersion.GetOrCreateThumbnail(thumbnailName);
            if (thumbnail == null)
                throw new HttpException("An error occured while creating the thumbnail.");
            
            // Save new Thumbnails
            db.SaveChanges();
            
            return new FileContentResult(thumbnail.Data, thumbnail.ContentType);
        }

        DbFileVersion GetLatestVersion(int fileId)
        {
            var file = db.Files.Include("Versions").FirstOrDefault(f => f.Id == fileId);
            if (file != null)
            {
                var latest = file.GetLatestVersion();
                if (latest != null)
                    return db.FileVersions.Include("Content").Include("Thumbnails").FirstOrDefault(v => v.Id == latest.Id);
            }

            return null;
        }
    }
}
