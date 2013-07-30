using Caps.Data;
using Caps.Web.UI.Infrastructure.WebApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Caps.Web.UI.Controllers
{
    [Authorize, SetUserActivity, ValidateJsonAntiForgeryToken]
    public class DbFileController : ApiController
    {
        CapsDbContext db;

        public DbFileController(CapsDbContext db)
        {
            this.db = db;
        }

        public HttpResponseMessage Delete(int id)
        {
            var file = db.Files.Include("Versions.Content").Include("Versions.Thumbnails").FirstOrDefault(f => f.Id == id);
            if (file == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            try
            {
                Array.ForEach(file.Versions.ToArray(), v =>
                {
                    Array.ForEach(v.Thumbnails.ToArray(), t => db.Thumbnails.Remove(t));
                    Array.ForEach(v.Properties.ToArray(), p => db.FileProperties.Remove(p));
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
