using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class SitemapNodeResource
    {
        [Key, Column(Order = 1)]
        public int SitemapNodeId { get; set; }
        [Key, Column(Order = 2)]
        [MaxLength(10)]
        public String Language { get; set; }

        [MaxLength(50)]
        public String Title { get; set; }
        [MaxLength(500)]
        public String Keywords { get; set; }
        [MaxLength(500)]
        public String Description { get; set; }

        [InverseProperty("Resources"), ForeignKey("SitemapNodeId")]
        public SitemapNode SitemapNode { get; set; }
    }
}
