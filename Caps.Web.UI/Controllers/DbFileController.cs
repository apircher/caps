using Caps.Data;
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
    }
}
