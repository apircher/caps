using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbSiteMapNode : ILocalizableEntity<DbSiteMapNodeResource>
    {
        public int Id { get; set; }
        public int SiteMapId { get; set; }
        public int? ParentNodeId { get; set; }
        public int? ContentId { get; set; }
        public int PermanentId { get; set; }
        public String Name { get; set; }
        public int Ranking { get; set; }
        public String NodeType { get; set; }
        public bool IsDeleted { get; set; }
        public String Redirect { get; set; }
        public String RedirectType { get; set; }
        public String ActionUrl { get; set; }
        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }
        public ICollection<DbSiteMapNode> ChildNodes { get; set; }
        public ICollection<DbSiteMapNodeResource> Resources { get; set; }
        public Publication Content { get; set; }        
        
        public bool IsNodeType(String nodeType)
        {
            return String.Equals(NodeType, nodeType, StringComparison.OrdinalIgnoreCase);
        }
        public bool IsNodeTypeIn(params String[] nodeTypes)
        {
            return nodeTypes.Any(t => IsNodeType(t));
        }
    }
}
