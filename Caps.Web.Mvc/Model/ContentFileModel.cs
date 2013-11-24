using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc.Model
{
    public class ContentFileModel
    {
        public String Name { get; set; }
        public String Language { get; set; }
        public String Determination { get; set; }
        public String Group { get; set; }
        public int Ranking { get; set; }

        public String Title { get; set; }
        public String Description { get; set; }
        public String Credits { get; set; }

        public int FileVersionId { get; set; }
        public String FileName { get; set; }
    }
}
