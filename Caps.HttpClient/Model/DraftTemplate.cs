using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DraftTemplate
    {
        public int Id { get; set; }
        public String Name { get; set; }
        public int WebsiteId { get; set; }
        public String Description { get; set; }
        public String TemplateContent { get; set; }
    }
}
