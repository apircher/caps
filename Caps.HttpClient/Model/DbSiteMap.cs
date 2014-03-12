using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbSiteMap
    {
        public int Id { get; set; }
        public int WebsiteId { get; set; }
        public int Version { get; set; }
        public DateTime? PublishedFrom { get; set; }
        public String PublishedBy { get; set; }
        public ICollection<DbSiteMapNode> SiteMapNodes { get; set; }
    }
}
