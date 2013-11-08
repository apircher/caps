using Breeze.ContextProvider;
using Breeze.WebApi2;
using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Caps.Web.UI.Controllers
{
    [Authorize, BreezeController, ValidateJsonAntiForgeryToken, SetUserActivity, BreezeQueryable(MaxExpansionDepth=3)]
    public class CapsDataController : ApiController
    {
        readonly CapsDbContextProvider _contextProvider;

        public CapsDataController()
        {
            _contextProvider = new CapsDbContextProvider(User);
        }

        // ~/breeze/capsdata/Metadata
        [HttpGet, AllowAnonymous]
        public String Metadata()
        {
            return _contextProvider.Metadata();
        }

        // ~/breeze/capsdata/Authors
        [HttpGet]
        public IQueryable<Author> Authors()
        {
            return _contextProvider.Context.Authors;
        }

        // ~/breeze/capsdata/Files
        [HttpGet]
        public IQueryable<DbFile> Files()
        {
            return _contextProvider.Context.Files;
        }

        // ~/breeze/capsdata/Files
        [HttpGet]
        public IQueryable<DbFile> FilteredFiles(String filterOptions)
        {
            var filters = FilesFilterOptions.Parse(filterOptions);
            var predicate = filters.GetPredicate();
            return predicate == null ? _contextProvider.Context.Files : _contextProvider.Context.Files.Where(predicate);
        }

        // ~/breeze/capsdata/Tags
        [HttpGet]
        public IQueryable<Tag> Tags()
        {
            return _contextProvider.Context.Tags;
        }

        // ~/breeze/capsdata/FileVersions
        [HttpGet]
        public IQueryable<DbFileVersion> FileVersions()
        {
            return _contextProvider.Context.FileVersions;
        }

        // ~/breeze/capsdata/Drafts
        [HttpGet]
        public IQueryable<Draft> Drafts()
        {
            return _contextProvider.Context.Drafts;
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


        // ~/breeze/capsdata/SitemapNodes
        [HttpGet]
        public IQueryable<SitemapNode> SitemapNodes()
        {
            return _contextProvider.Context.SitemapNodes;
        }
        // ~/breeze/capsdata/SitemapNodeContents
        [HttpGet]
        public IQueryable<SitemapNodeContent> SitemapNodeContents()
        {
            return _contextProvider.Context.SitemapNodeContents;
        }

        // ~/breeze/capsdata/SaveChanges
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _contextProvider.SaveChanges(saveBundle);
        }

    }
}
