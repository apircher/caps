using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Caps.Web.Mvc.SiteMap
{
    public interface ISiteMapBuilder : IDisposable
    {
        CapsSiteMapBuilderResult BuildSiteMap(StaticSiteMapProvider provider, Action<SiteMapNode, SiteMapNode> addNodeAction);
    }

    public class CapsSiteMapBuilderResult
    {
        public SiteMapNode RootNode { get; set; }
        public IDictionary<int, SiteMapNode> IndexIdToNode { get; set; }
        public IDictionary<String, SiteMapNode> IndexNameToNode { get; set; }
        public DateTime SiteMapExpiration { get; set; }
    }
}
