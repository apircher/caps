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
using System.Collections.Specialized;
using WebApi.OutputCache.V2;

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
                var result = new Dictionary<String, DbFile>();

                switch (GetStorageAction(formData))
                {
                    case StorageAction.Replace:
                        var versionId = formData["versionId"];
                        if (!String.IsNullOrWhiteSpace(versionId))
                        {
                            var intVersionId = int.Parse(versionId);
                            var fileVersion = db.FileVersions
                                .Include("File").Include("Content").Include("Thumbnails").Include("Properties")
                                .Include("PublicationFileResources.PublicationFile")
                                .FirstOrDefault(v => v.Id == intVersionId);
                            var file = files[0];
                            ReplaceFileVersion(fileVersion, file.Versions.First());
                            result.Add(file.FileName, fileVersion.File);
                        }
                        else
                        {
                            foreach(var file in files) {
                                var existingFile = ReplaceLatestVersionWithFileName(file.FileName, file.Versions.First());
                                if (existingFile == null) {
                                    AddFile(file);
                                    existingFile = file;
                                }
                                result.Add(file.FileName, existingFile);
                            }
                        }
                        break;

                    default:
                        Array.ForEach(files.ToArray(), f => {
                            String originalFileName = f.FileName;
                            AddFile(f);
                            result.Add(originalFileName, f);
                        });
                        break;
                }

                db.SaveChanges();

                return Request.CreateResponse(HttpStatusCode.OK, result.Select(p => new { FileName = p.Key, Id = p.Value.Id }).ToList());
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex);
            }
        }
        
        void AddFile(DbFile file)
        {
            var latestVersion = file.GetLatestVersion();

            var existingFiles = db.Files.Where(f => f.FileName.ToLower().StartsWith(file.FileName.ToLower())).ToList();
            if (existingFiles.Count > 0)
            {
                file.FileName = String.Format("{0}({1}){2}", System.IO.Path.GetFileNameWithoutExtension(file.FileName),
                    existingFiles.Count + 1, System.IO.Path.GetExtension(file.FileName));
            }

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

            if (fileVersion.File.IsImage)
                HandleNewImageFile(fileVersion);

            if (fileVersion.PublicationFileResources.Any())
                InvalidateCache();
        }

        DbFile ReplaceLatestVersionWithFileName(String fileName, DbFileVersion data)
        {
            var key = fileName.ToLower();
            var dbFile = db.Files
                .Include("Versions.Content")
                .Include("Versions.Thumbnails")
                .Include("Versions.PublicationFileResources.PublicationFile")
                .Include("Versions.Properties")
                .FirstOrDefault(f => f.FileName.ToLower() == key);

            if (dbFile != null)
            {
                var fileVersion = dbFile.GetLatestVersion();
                if (fileVersion != null)
                    ReplaceFileVersion(fileVersion, data);
            }
            return dbFile;
        }

        DbFile AddVersionForFileName(String fileName, DbFileVersion data)
        {
            var key = fileName.ToLower();
            var existingFile = db.Files.Where(f => f.FileName.ToLower() == key).FirstOrDefault();
            if (existingFile != null)
            {
                var publicationFileResources = db.Files.Where(f => f.Versions.Any(z => z.PublicationFileResources.Any()))
                    .Select(f => f.Versions.Where(x => x.PublicationFileResources.Any()).Select(y => y.PublicationFileResources))
                    .ToList();
                if (publicationFileResources.Any())
                    InvalidateCache();

                var bytes = data.Content.Data;
                var v = existingFile.AddNewVersion(bytes, User.Identity.Name);
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
            version.AddOrSetProperty(DbFileProperties.ImageWidth, size.Width);
            version.AddOrSetProperty(DbFileProperties.ImageHeight, size.Height);
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

        void InvalidateCache()
        {
            var cache = Configuration.CacheOutputConfiguration().GetCacheOutputProvider(Request);
            cache.RemoveStartsWith(Configuration.CacheOutputConfiguration().MakeBaseCachekey((WebsiteController t) => t.GetContent(0, 0)));
            cache.RemoveStartsWith(Configuration.CacheOutputConfiguration().MakeBaseCachekey((WebsiteController t) => t.GetContentFileVersion(0, 0)));
            cache.RemoveStartsWith(Configuration.CacheOutputConfiguration().MakeBaseCachekey((WebsiteController t) => t.GetThumbnail(0, 0, null, null, null)));
        }
    }
}
