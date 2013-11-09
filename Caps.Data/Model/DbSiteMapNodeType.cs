using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public static class DbSiteMapNodeType
    {
        public const String Page = "PAGE";
        public const String Publication = "PUBLICATION";
        public const String Teaser = "TEASER";

        static Dictionary<String, String> nodeTypeToTitle = new Dictionary<String, String>
        {
            { Page, "Seite" },
            { Publication, "Veröffentlichung" },
            { Teaser, "Aufmacher" }
        };

        public static bool IsNodeType(this DbSiteMapNode node, String nodeType)
        {
            if (node == null)
                return false;
            return String.Equals(node.NodeType, nodeType, StringComparison.OrdinalIgnoreCase);
        }
        public static bool IsNodeTypeIn(this DbSiteMapNode node, params String[] nodeTypes)
        {
            return nodeTypes.Any(nt => node.IsNodeType(nt));
        }

        public static String TitleForNodeType(String type)
        {
            if (nodeTypeToTitle.ContainsKey(type.ToUpperInvariant()))
                return nodeTypeToTitle[type.ToUpperInvariant()];
            return type;
        }
    }
}
