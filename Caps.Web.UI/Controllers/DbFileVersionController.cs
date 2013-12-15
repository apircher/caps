﻿using Caps.Data;
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
    public class DbFileVersionController : ApiController
    {
        CapsDbContext db;

        public DbFileVersionController(CapsDbContext db)
        {
            this.db = db;
        }

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
    }
}