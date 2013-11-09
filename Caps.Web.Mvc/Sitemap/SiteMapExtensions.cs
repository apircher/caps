using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc.Sitemap
{
    public static class SiteMapExtensions
    {
        public static int Level(this System.Web.SiteMapNode node)
        {
            int level = 0;
            var current = node;
            while (current != null)
            {
                level++;
                current = current.ParentNode;
            }
            return level;
        }

        public static IEnumerable<System.Web.SiteMapNode> GetBreadCrumbs(this System.Web.SiteMapNode node)
        {
            var nodeList = new List<System.Web.SiteMapNode>();
            var current = node != null ? node.ParentNode : null;
            while (current != null)
            {
                nodeList.Insert(0, current);
                current = current.ParentNode;
            }

            foreach (var item in nodeList)
                yield return item;
        }
    }
}
