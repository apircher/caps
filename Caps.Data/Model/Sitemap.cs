using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class Sitemap
    {
        public int Id { get; set; }
        public int WebsiteId { get; set; }
        public int Version { get; set; }

        [ForeignKey("WebsiteId")]
        [InverseProperty("Sitemaps")]
        public Website Website { get; set; }
    }
}
