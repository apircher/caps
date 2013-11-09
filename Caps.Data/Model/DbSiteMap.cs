using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbSiteMap
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        
        [Required]
        public int WebsiteId { get; set; }

        [Required]
        public int Version { get; set; }

        [InverseProperty("SiteMapVersions"), ForeignKey("WebsiteId")]
        public Website Website { get; set; }

        public DateTime? PublishedFrom { get; set; }

        public String PublishedBy { get; set; }

        [InverseProperty("SiteMap")]
        public ICollection<DbSiteMapNode> SiteMapNodes { get; set; }
    }
}
