using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class SitemapNodeContentPart
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int SitemapNodeContentId { get; set; }

        [InverseProperty("ContentParts"), ForeignKey("SitemapNodeContentId")]
        public SitemapNodeContent SitemapNodeContent { get; set; }
        
        [MaxLength(50)]
        public String PartType { get; set; }
        [MaxLength(50)]
        public String ContentType { get; set; }

        public int Ranking { get; set; }
    }
}
