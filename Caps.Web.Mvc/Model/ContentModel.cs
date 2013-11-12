using Caps.Data.ContentControls;
using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Newtonsoft.Json.Linq;

namespace Caps.Web.Mvc.Model
{
    public class ContentModel
    {
        public DbSiteMapNode SiteMapNode { get; set; }
        public IEnumerable<ContentPartModel> ContentParts { get; set; }

        public bool HasLocalizedContent
        {
            get
            {
                return ContentParts.All(c => !c.IsFallback);
            }
        }

        public String TemplateName
        {
            get
            {
                if (SiteMapNode == null || SiteMapNode.Content == null)
                    return null;

                dynamic template = JObject.Parse(SiteMapNode.Content.TemplateData);
                if (template != null)
                    return template.name;
                return null;
            }
        }

        public bool HasPart(String usage)
        {
            return ContentParts.Any(p => String.Equals(p.Usage, usage, StringComparison.OrdinalIgnoreCase));
        }

        public ContentPartModel FindPart(String usage)
        {
            return ContentParts.FirstOrDefault(p => String.Equals(p.Usage, usage, StringComparison.OrdinalIgnoreCase));
        }

        public String GetPart(String usage)
        {
            var urlHelper = new CapsUrlHelper(HttpContext.Current.Request.RequestContext);
            return GetPart(usage, urlHelper);
        }
        public String GetPart(String usage, IUrlHelper urlHelper)
        {
            var part = FindPart(usage);
            return part != null ? part.PrepareDisplay(SiteMapNode, urlHelper, ScriptManager) : String.Empty;
        }

        ContentScriptManager scriptManager;
        public ContentScriptManager ScriptManager
        {
            get
            {
                if (scriptManager == null)
                    scriptManager = new ContentScriptManager();
                return scriptManager;
            }
        }
    }

    class CapsUrlHelper : UrlHelper, IUrlHelper
    {
        public CapsUrlHelper(System.Web.Routing.RequestContext context)
            : base(context)
        {
        }


        public string Publication(int permanentId)
        {
            var capsSiteMapProvider = SiteMap.Provider as Caps.Web.Mvc.Providers.CapsSitemapProvider;
            if (capsSiteMapProvider != null)
            {
                var node = capsSiteMapProvider.FindSitemapNode(permanentId);
                if (node != null) return node.Url;
            }
            return String.Empty;
        }
    }
}
