﻿using Breeze.ContextProvider;
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
using WebApi.OutputCache.V2;

namespace Caps.Web.UI.Controllers
{
    [Authorize, BreezeController, ValidateJsonAntiForgeryToken, SetUserActivity, BreezeQueryable(MaxExpansionDepth=4)]
    public class CapsDataController : ApiController
    {
        readonly CapsDbContextProvider _contextProvider;

        public CapsDataController()
        {
            _contextProvider = new CapsDbContextProvider();
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
            return _contextProvider.Context.Users;
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

        // ~/breeze/capsdata/SiteMaps
        [HttpGet]
        public IQueryable<DbSiteMap> SiteMaps()
        {
            return _contextProvider.Context.SiteMaps;
        }


        // ~/breeze/capsdata/SiteMapNodes
        [HttpGet]
        public IQueryable<DbSiteMapNode> SiteMapNodes()
        {
            return _contextProvider.Context.SiteMapNodes;
        }
        // ~/breeze/capsdata/Publications
        [HttpGet]
        public IQueryable<Publication> Publications()
        {
            return _contextProvider.Context.Publications;
        }
        // ~/breeze/capsdata/DraftTemplates
        [HttpGet]
        public IQueryable<DraftTemplate> DraftTemplates()
        {
            return _contextProvider.Context.DraftTemplates;
        }

        // ~/breeze/capsdata/SaveChanges
        public SaveResult SaveChanges(JObject saveBundle)
        {
            var r = _contextProvider.SaveChanges(saveBundle);

            if (HasSiteMapOrContentChanged(r))
            {
                var cache = Configuration.CacheOutputConfiguration().GetCacheOutputProvider(Request);
                cache.RemoveStartsWith(Configuration.CacheOutputConfiguration().MakeBaseCachekey((WebsiteController t) => t.GetCurrentSiteMap(0)));
                cache.RemoveStartsWith(Configuration.CacheOutputConfiguration().MakeBaseCachekey((WebsiteController t) => t.GetContent(0, 0)));
                cache.RemoveStartsWith(Configuration.CacheOutputConfiguration().MakeBaseCachekey((WebsiteController t) => t.GetTeasers(0)));                
            }

            return r;
        }

        bool HasSiteMapOrContentChanged(SaveResult r)
        {
            if (r.Entities.Any(e => e is DbSiteMap || e is DbSiteMapNode || e is DbSiteMapNodeResource || e is Publication))
                return true;

            return false;
        }
    }
}
