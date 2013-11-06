using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class Sitemap
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        
        [Required]
        public int WebsiteId { get; set; }

        [Required]
        public int Version { get; set; }

        [InverseProperty("Sitemaps"), ForeignKey("WebsiteId")]
        public Website Website { get; set; }

        [InverseProperty("Sitemap")]
        public ICollection<SitemapNode> Nodes { get; set; }
    }
}
