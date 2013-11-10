using Caps.Web.Mvc.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace Caps.Web.Mvc
{
    public static class HtmlHelperExtensions
    {
        public static IHtmlString RenderContentPart(this HtmlHelper helper, ContentModel content, String partName)
        {
            var contentPart = content.FindPart(partName);
            if (contentPart != null)
            {
                CapsUrlHelper urlHelper = new CapsUrlHelper(helper.ViewContext.RequestContext);
                var rawContent = contentPart.PrepareDisplay(content.SiteMapNode, urlHelper, content.ScriptManager);
                return helper.Raw(rawContent);
            }

            return MvcHtmlString.Empty;
        }
    }
}
