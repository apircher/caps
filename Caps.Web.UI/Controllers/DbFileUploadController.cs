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

namespace Caps.Web.UI.Controllers
{
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
                Array.ForEach(files.ToArray(), f => AddFile(f) );

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
            db.Files.Add(file);

            if (file.IsImage)
            {
                var latestVersion = file.GetLatestVersion();
                var thumbnail = latestVersion.CreateThumbnail(220, 160);
                db.Thumbnails.Add(thumbnail);
            }
        }
    }
}
