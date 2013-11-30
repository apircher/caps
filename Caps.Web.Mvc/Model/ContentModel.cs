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
        public IEnumerable<ContentFileModel> ContentFiles { get; set; }

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

                dynamic template = JObject.Parse(SiteMapNode.Content.Template);
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

        public IEnumerable<ContentFileModel> Downloads
        {
            get
            {
                if (ContentFiles == null || !ContentFiles.Any())
                    return new List<ContentFileModel>();
                return ContentFiles.Where(f => String.Equals(f.Determination, "Download", StringComparison.OrdinalIgnoreCase)).OrderBy(f => f.Ranking).ToList();
            }
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
            var capsSiteMapProvider = System.Web.SiteMap.Provider as Caps.Web.Mvc.Providers.CapsSiteMapProvider;
            if (capsSiteMapProvider != null)
            {
                var node = capsSiteMapProvider.FindSiteMapNode(permanentId);
                if (node != null) return node.Url;
            }
            return String.Empty;
        }
    }
}
