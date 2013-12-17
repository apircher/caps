using Caps.Data.ContentControls;
using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace Caps.Web.Mvc.Model
{
    public class ContentPartModel
    {
        public String Content { get; set; }
        public String Language { get; set; }
        public String Usage { get; set; }
        public bool IsFallback { get; set; }

        public String PrepareDisplay(DbSiteMapNode node, IUrlHelper urlHelper, ContentScriptManager scriptManager)
        {
            var controlRegistry = DependencyResolver.Current.GetService<ContentControlRegistry>();
            var content = Content;
            if (!String.IsNullOrWhiteSpace(content))
            {
                var pp = new ContentPreprocessor(node, controlRegistry);
                content = pp.PrepareDisplay(Usage, content, Language, urlHelper, scriptManager);
            }

            return content;
        }
    }
}
