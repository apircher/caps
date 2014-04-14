using Caps.Consumer.Model;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;
using Caps.Consumer.Mvc.Utils;
using Caps.Consumer.Mvc.SiteMap;
using System.Web;

namespace Caps.Consumer.Mvc
{
    public class CapsControllerBase : Controller
    {
        CapsHttpClient client;
        ContentService contentService;

        public CapsControllerBase()
        {
        }

        protected CapsHttpClient CapsClient
        {
            get
            {
                if (client == null)
                    client = CreateCapsHttpClient();
                return client;
            }
        }

        protected ContentService ContentService
        {
            get
            {
                if (contentService == null)
                    contentService = new ContentService(CapsClient);
                return contentService;
            }
        }

        protected virtual CapsHttpClient CreateCapsHttpClient()
        {
            return new CapsHttpClient(new Uri(ConfigurationManager.AppSettings["caps:Url"]),
                ConfigurationManager.AppSettings["caps:AppKey"],
                ConfigurationManager.AppSettings["caps:AppSecret"]);
        }

        protected virtual bool ValidateContentName(ContentModel content, String name)
        {
            return content.SiteMapNode.Resources.Any(
                r => String.Equals(r.Title.UrlEncode(), name, StringComparison.OrdinalIgnoreCase));
        }

        protected System.Web.SiteMapNode FindContentByName(String name)
        {
            // Try to find content with the same name.
            var nodeEntity = CapsSiteMap.FindSiteMapNodeByLocalizedName(name) as CapsSiteMapNode;
            if (nodeEntity != null)
                return CapsSiteMap.FindSiteMapNode(nodeEntity.PermanentId);
            return null;
        }

        protected virtual bool ViewExists(string name)
        {
            ViewEngineResult result = ViewEngines.Engines.FindView(ControllerContext, name, null);
            return (result.View != null);
        }

        protected Caps.Consumer.Mvc.Providers.CapsSiteMapProvider CapsSiteMap
        {
            get
            {
                return System.Web.SiteMap.Provider as Caps.Consumer.Mvc.Providers.CapsSiteMapProvider;
            }
        }

        protected bool CheckClientETag(DbFileVersion fileVersion)
        {
            String etag = Convert.ToBase64String(fileVersion.Hash);
            String clientEtag = Request.Headers["If-None-Match"];
            return String.Equals(etag, clientEtag);
        }

        protected bool CheckClientETag(DbThumbnail thumbnail)
        {
            String etag = Convert.ToBase64String(thumbnail.OriginalFileHash) + "_" + thumbnail.Name;
            String clientEtag = Request.Headers["If-None-Match"];
            return String.Equals(etag, clientEtag);
        }

        protected void SetClientETag(DbFileVersion fileVersion)
        {
            Response.Cache.SetCacheability(HttpCacheability.ServerAndPrivate);
            Response.Cache.SetETag(Convert.ToBase64String(fileVersion.Hash));
        }

        protected void SetClientETag(DbThumbnail thumbnail)
        {
            Response.Cache.SetCacheability(HttpCacheability.ServerAndPrivate);
            Response.Cache.SetETag(Convert.ToBase64String(thumbnail.OriginalFileHash) + "_" + thumbnail.Name);
        }
    }
}
