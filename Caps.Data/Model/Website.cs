using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class Website
    {
        public int Id { get; set; }
        public String Name { get; set; }
        public String Url { get; set; }

        [InverseProperty("Website")]
        public ICollection<Sitemap> Sitemaps { get; set; }
    }
}
