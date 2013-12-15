using Caps.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Data.Model;
using Caps.Web.Mvc;
using Caps.Web.Mvc.Imaging;
using System.Collections.Specialized;

namespace Caps.Web.UI.Controllers
{
    public enum StorageAction
    {
        UnSet = 0,
        Add,
        Replace
    }

    [Authorize, ValidateJsonAntiForgeryToken, SetUserActivity]
    public class DbFileUploadController : ApiController
    {
        CapsDbContext db;

        public DbFileUploadController(CapsDbContext db)
        {
            this.db = db;
        }

        public async Task<HttpResponseMessage> PostFile()
        {
            if (!Request.Content.IsMimeMultipartContent())
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            
            try
            {
                var provider = new MultipartMemoryStreamProvider();
                await Request.Content.ReadAsMultipartAsync(provider);
                
                var files = provider.Contents.GetFiles(User.Identity.Name);
                var formData = provider.Contents.GetFormData();

                switch (GetStorageAction(formData))
                {
                    case StorageAction.Replace:
                        var versionId = formData["versionId"];
                        if (!String.IsNullOrWhiteSpace(versionId))
                        {
                            var intVersionId = int.Parse(versionId);
                            var fileVersion = db.FileVersions.Include("Content").Include("Thumbnails").FirstOrDefault(v => v.Id == intVersionId);
                            ReplaceFileVersion(fileVersion, files[0].Versions.First());
                        }
                        break;

                    default:
                        Array.ForEach(files.ToArray(), f => AddFile(f));
                        break;
                }

                db.SaveChanges();

                var result = files.Select(f => new { FileName = f.FileName, Id = f.Id }).ToList();
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex);
            }
        }
        
        void AddFile(DbFile file)
        {
            var latestVersion = file.GetLatestVersion();

            db.Files.Add(file);

            if (file.IsImage)
                HandleNewImageFile(latestVersion);
        }

        void ReplaceFileVersion(DbFileVersion fileVersion, DbFileVersion data)
        {
            fileVersion.Content.Data = data.Content.Data;
            fileVersion.Hash = data.Hash;
            fileVersion.FileSize = data.FileSize;
            fileVersion.Modified.At = DateTime.UtcNow;
            fileVersion.Modified.By = User.Identity.Name;

            Array.ForEach(fileVersion.Thumbnails.ToArray(), t => db.Thumbnails.Remove(t));
        }

        DbFile ReplaceFileByFileName(DbFile file)
        {
            var key = file.FileName.ToLower();
            var existingFile = db.Files.Where(f => f.FileName.ToLower() == key).FirstOrDefault();
            if (existingFile != null)
            {
                var data = file.GetLatestVersion().Content.Data;
                var v = existingFile.AddNewVersion(data, User.Identity.Name);
                if (existingFile.IsImage) HandleNewImageFile(v);
            }
            return existingFile;
        }

        void HandleNewImageFile(DbFileVersion version)
        {
            // Create Thumbnail
            var thumbnail = version.CreateThumbnail(220, 160);
            db.Thumbnails.Add(thumbnail);

            // Add Properties
            var size = version.GetImageSize();
            version.AddProperty(DbFileProperties.ImageWidth, size.Width);
            version.AddProperty(DbFileProperties.ImageHeight, size.Height);
        }

        StorageAction GetStorageAction(NameValueCollection formData)
        {
            var storageAction = formData["storageAction"];

            if (String.Equals(storageAction, "replace", StringComparison.OrdinalIgnoreCase))
                return StorageAction.Replace;

            if (String.Equals(storageAction, "add", StringComparison.OrdinalIgnoreCase))
                return StorageAction.Add;

            return StorageAction.UnSet;
        }
    }
}
