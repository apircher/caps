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
    public class DbSiteMapNode
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int SiteMapId { get; set; }

        public int? ParentNodeId { get; set; }

        public int? ContentId { get; set; }

        [Required]
        public int PermanentId { get; set; }

        [MaxLength(50)]
        public String Name { get; set; }

        public int Ranking { get; set; }

        [MaxLength(50)]
        public String NodeType { get; set; }

        [DefaultValue(false)]
        public bool IsDeleted { get; set; }

        [MaxLength(250)]
        public String Redirect { get; set; }

        [MaxLength(50)]
        public String RedirectType { get; set; }

        [MaxLength(250)]
        public String ActionUrl { get; set; }
                
        public ChangeInfo Created { get; set; }

        public ChangeInfo Modified { get; set; }

        [InverseProperty("SiteMapNodes"), ForeignKey("SiteMapId")]
        public DbSiteMap SiteMap { get; set; }

        [InverseProperty("ParentNode")]
        public ICollection<DbSiteMapNode> ChildNodes { get; set; }

        [InverseProperty("ChildNodes"), ForeignKey("ParentNodeId")]
        public DbSiteMapNode ParentNode { get; set; }

        [InverseProperty("SiteMapNode")]
        public ICollection<DbSiteMapNodeResource> Resources { get; set; }

        [InverseProperty("SiteMapNodes"), ForeignKey("ContentId")]
        public Publication Content { get; set; }
    }
}
