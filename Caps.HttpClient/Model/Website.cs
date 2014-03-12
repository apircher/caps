using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class Website
    {
        public int Id { get; set; }
        public String Name { get; set; }
        public String Url { get; set; }      
        public ICollection<DbSiteMap> SiteMapVersions { get; set; }
        public ICollection<DraftTemplate> DraftTemplates { get; set; }
    }
}
