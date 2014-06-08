using Caps.Data;
using Caps.Web.UI.Infrastructure.WebApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi.OutputCache.V2;

namespace Caps.Web.UI.Controllers
{
    [Authorize, SetUserActivity, ValidateJsonAntiForgeryToken]
    [RoutePrefix("api/dbfileversion")]
    public class DbFileVersionController : ApiController
    {
        CapsDbContext db;

        public DbFileVersionController(CapsDbContext db)
        {
            this.db = db;
        }

        [Route("{id:int}/thumbnails")]
        public HttpResponseMessage GetThumbnails(int id)
        {
            var fileVersion = db.FileVersions.Include("Thumbnails").FirstOrDefault(v => v.Id == id);
            if (fileVersion == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var thumbnailInfo = fileVersion.Thumbnails.Select(t => new Caps.Data.Model.DbThumbnail
            {
                Id = t.Id,
                FileVersionId = t.FileVersionId,
                Name = t.Name,
                OriginalFileHash = t.OriginalFileHash,
                Width = t.Width,
                Height = t.Height,
                ContentType = t.ContentType
            });

            return Request.CreateResponse(HttpStatusCode.OK, thumbnailInfo.ToList());

        }

        [HttpDelete]
        [Route("{id:int}/thumbnail/{thumbnailId:int}")]
        public HttpResponseMessage DeleteThumbnail(int id, int thumbnailId)
        {
            var thumbnail = db.Thumbnails.FirstOrDefault(t => t.Id == thumbnailId);
            if (thumbnail == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            db.Thumbnails.Remove(thumbnail);
            try
            {
                db.SaveChanges();

                InvalidateCache();
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (System.Data.Common.DbException ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex);
            }
        }

        [HttpDelete]
        [Route("{id:int}")]
        public HttpResponseMessage Delete(int id)
        {
            var fileVersion = db.FileVersions
                .Include("Content")
                .Include("Thumbnails")
                .Include("Properties")
                .Include("PublicationFileResources")
                .Include("DraftFileResources")
                .FirstOrDefault(f => f.Id == id);

            if (fileVersion == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (fileVersion.PublicationFileResources.Count > 0)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            if (fileVersion.DraftFileResources.Count > 0)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            try
            {
                if (fileVersion.Thumbnails != null) Array.ForEach(fileVersion.Thumbnails.ToArray(), t => db.Thumbnails.Remove(t));
                if (fileVersion.Properties != null) Array.ForEach(fileVersion.Properties.ToArray(), p => db.FileProperties.Remove(p));
                db.FileContents.Remove(fileVersion.Content);
                db.FileVersions.Remove(fileVersion);
                db.SaveChanges();
            }
            catch (System.Data.Common.DbException ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        void InvalidateCache()
        {
            var cache = Configuration.CacheOutputConfiguration().GetCacheOutputProvider(Request);
            cache.RemoveStartsWith(Configuration.CacheOutputConfiguration().MakeBaseCachekey((WebsiteController t) => t.GetThumbnail(0, 0, null, null, null)));
        }
    }
}
