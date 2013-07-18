using Breeze.WebApi;
using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure.WebApi;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Caps.Web.UI.Controllers
{
    [Authorize, BreezeController, ValidateJsonAntiForgeryToken, SetUserActivity]
    public class CapsDataController : ApiController
    {
        readonly EFContextProvider<CapsDbContext> _contextProvider = new EFContextProvider<CapsDbContext>();

        // ~/breeze/capsdata/Metadata
        [HttpGet]
        public String Metadata()
        {
            return _contextProvider.Metadata();
        }

        // ~/breeze/capsdata/Websites
        [HttpGet]
        public IQueryable<Website> Websites()
        {
            return _contextProvider.Context.Websites;
        }

        // ~/breeze/capsdata/Sitemaps
        [HttpGet]
        public IQueryable<Sitemap> Sitemaps()
        {
            return _contextProvider.Context.Sitemaps;
        }

        // ~/breeze/capsdata/SaveChanges
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _contextProvider.SaveChanges(saveBundle);
        }
    }
}
