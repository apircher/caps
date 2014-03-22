using Caps.Consumer.ContentControls;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace Caps.Consumer.Mvc
{
    public class CapsUrlHelper : UrlHelper, IUrlHelper
    {
        public CapsUrlHelper(System.Web.Routing.RequestContext context)
            : base(context)
        {
        }

        public string Publication(int permanentId)
        {
            var capsSiteMapProvider = System.Web.SiteMap.Provider as Caps.Consumer.Mvc.Providers.CapsSiteMapProvider;
            if (capsSiteMapProvider != null)
            {
                var node = capsSiteMapProvider.FindSiteMapNode(permanentId);
                if (node != null) return node.Url;
            }
            return String.Empty;
        }
    }

    public static class CapsUrlHelperExtensions
    {
        /// <summary>
        /// Returns the content of the first ContentPart-Instance with the given usage-value. 
        /// </summary>
        /// <param name="usage"></param>
        /// <returns></returns>
        public static String GetPart(this Caps.Consumer.Model.ContentModel model, String usage)
        {
            var urlHelper = new CapsUrlHelper(System.Web.HttpContext.Current.Request.RequestContext);
            var controlRegistry = CapsConfiguration.ContentControlRegistryFactory();
            return model.GetPart(usage, urlHelper, controlRegistry);
        }
    }
}
