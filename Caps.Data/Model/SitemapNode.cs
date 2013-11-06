using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class SitemapNode
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int SitemapId { get; set; }

        public int? ParentNodeId { get; set; }

        public int? ContentId { get; set; }

        [MaxLength(50)]
        public String ExternalName { get; set; }

        public int Ranking { get; set; }

        [MaxLength(50)]
        public String NodeType { get; set; }

        [DefaultValue(false)]
        public bool IsDeleted { get; set; }

        [MaxLength(250)]
        public String Redirect { get; set; }

        [MaxLength(50)]
        public String RedirectType { get; set; }
                
        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }

        [InverseProperty("Nodes"), ForeignKey("SitemapId")]
        public Sitemap Sitemap { get; set; }

        [InverseProperty("ParentNode")]
        public ICollection<SitemapNode> ChildNodes { get; set; }

        [InverseProperty("ChildNodes"), ForeignKey("ParentNodeId")]
        public SitemapNode ParentNode { get; set; }

        [InverseProperty("SitemapNode")]
        public ICollection<SitemapNodeResource> Resources { get; set; }

        [InverseProperty("SitemapNodes"), ForeignKey("ContentId")]
        public SitemapNodeContent Content { get; set; }
    }
}
