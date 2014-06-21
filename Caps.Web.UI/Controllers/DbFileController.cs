using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Caps.Web.UI.Controllers
{
    [Authorize, SetUserActivity, ValidateJsonAntiForgeryToken]
    [RoutePrefix("api/dbfile")]
    public class DbFileController : ApiController
    {
        CapsDbContext db;

        public DbFileController(CapsDbContext db)
        {
            this.db = db;
        }

        [HttpPost]
        [Route("addtag")]
        public HttpResponseMessage AddTag(EntityTagModel model) 
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var file = db.Files.Include("Tags.Tag").FirstOrDefault(f => f.Id == model.EntityId);
            if (file == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            try
            {
                if (!file.Tags.Any(t => t.Tag.Name.ToLower() == model.TagName.ToLower()))
                {
                    var tag = db.GetOrCreateTag(model.TagName);
                    var fileTag = new Caps.Data.Model.DbFileTag { File = file, Tag = tag };
                    file.Tags.Add(fileTag);
                    db.SaveChanges();
                }
            }
            catch (System.Data.Common.DbException ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [HttpPost]
        [Route("removetag")]
        public HttpResponseMessage RemoveTag(EntityTagModel model) 
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var file = db.Files.Include("Tags.Tag").FirstOrDefault(f => f.Id == model.EntityId);
            if (file == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            try
            {
                var fileTags = file.Tags.Where(t => t.Tag.Name.ToLower() == model.TagName.ToLower());
                Array.ForEach(fileTags.ToArray(), t => file.Tags.Remove(t));
                db.SaveChanges();
            }
            catch (System.Data.Common.DbException ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [HttpPost]
        [Route("metadata")]
        public HttpResponseMessage GetFileMetadata([FromBody]List<String> fileNames)
        {
            List<object> result = new List<object>();
            Array.ForEach(fileNames.ToArray(), fileName =>
            {
                var query = db.Files.Where(f => f.FileName.ToLower() == fileName.ToLower());
                result.Add(new { FileName = fileName, Count = query.Count() });
            });
            return Request.CreateResponse(HttpStatusCode.OK, result.ToArray());
        }

        [HttpGet]
        [Route("{id:int}/inline/{fileName:regex(^([a-zA-Z\\-_%\\+0-9\\s]+)\\.([a-zA-Z0-9]+)$)}")]
        public HttpResponseMessage GetContentInline(int id, String fileName)
        {
            var latestVersion = GetFileVersion(id);
            if (latestVersion == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var result = Request.CreateResponse(HttpStatusCode.OK);
            var stream = new System.IO.MemoryStream(latestVersion.Content.Data);
            result.Content = new StreamContent(stream);
            result.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(latestVersion.File.ContentType);
            return result;
        }

        [HttpGet]
        [Route("{id:int}/download/{fileName:regex(^([a-zA-Z\\-_%\\+0-9\\s]+)\\.([a-zA-Z0-9]+)$)}")]
        public HttpResponseMessage GetContentDownload(int id, String fileName)
        {
            var latestVersion = GetFileVersion(id);
            if (latestVersion == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var result = Request.CreateResponse(HttpStatusCode.OK);
            var stream = new System.IO.MemoryStream(latestVersion.Content.Data);
            result.Content = new StreamContent(stream);
            result.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(latestVersion.File.ContentType);
            result.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment") { FileName = fileName };
            return result;
        }

        [HttpGet]
        [Route("{id:int}/thumbnail/{fileName:regex(^([a-zA-Z\\-_%\\+0-9\\s]+)\\.([a-zA-Z0-9]+)$)}")]
        public HttpResponseMessage GetContentThumbnail(int id, String fileName, String nameOrSize = "220x160")
        {
            var latestVersion = GetFileVersion(id);
            if (latestVersion == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var file = latestVersion.File;
            if (!file.IsImage) // TODO: Return default document thumbnail...
                return Request.CreateResponse(HttpStatusCode.BadRequest, "Can provide Thumbnails only for images.");

            var thumbnail = latestVersion.GetOrCreateThumbnail(nameOrSize, ImageProcessing.ThumbnailFitMode.Max, ImageProcessing.ThumbnailScaleMode.DownscaleOnly);
            if (thumbnail == null)
                return Request.CreateResponse(HttpStatusCode.InternalServerError, "An error occured while creating the thumbnail.");

            // Save new Thumbnails
            db.SaveChanges();

            var result = Request.CreateResponse(HttpStatusCode.OK);
            var stream = new System.IO.MemoryStream(thumbnail.Data);
            result.Content = new StreamContent(stream);
            result.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(thumbnail.ContentType);
            return result;
        }

        [HttpDelete]
        [Route("{id:int}")]
        public HttpResponseMessage DeleteFile(int id)
        {
            var file = db.Files
                .Include("Versions.Content")
                .Include("Versions.Thumbnails")
                .Include("Versions.Properties")
                .FirstOrDefault(f => f.Id == id);
            if (file == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            try
            {
                Array.ForEach(file.Versions.ToArray(), v =>
                {
                    if (v.Thumbnails != null) Array.ForEach(v.Thumbnails.ToArray(), t => db.Thumbnails.Remove(t));
                    if (v.Properties != null) Array.ForEach(v.Properties.ToArray(), p => db.FileProperties.Remove(p));
                    db.FileContents.Remove(v.Content);
                    db.FileVersions.Remove(v);
                });
                db.Files.Remove(file);
                db.SaveChanges();
            }
            catch (System.Data.Common.DbException ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }


        DbFileVersion GetFileVersion(int fileVersionId)
        {
            return db.FileVersions
                .Include("Content")
                .Include("Thumbnails")
                .Include("File")
                .FirstOrDefault(v => v.Id == fileVersionId);
        }
    }
}
