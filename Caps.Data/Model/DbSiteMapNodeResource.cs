using Caps.Data.Localization;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbSiteMapNodeResource : ILocalizedResource
    {
        [Key, Column(Order = 1)]
        public int SiteMapNodeId { get; set; }

        [Key, Column(Order = 2)]
        [MaxLength(10)]
        public String Language { get; set; }

        [MaxLength(50)]
        public String Title { get; set; }

        [MaxLength(500)]
        public String Keywords { get; set; }

        [MaxLength(500)]
        public String Description { get; set; }

        public int? PictureFileVersionId { get; set; }

        [InverseProperty("SiteMapNodeResources"), ForeignKey("PictureFileVersionId")]
        public DbFileVersion PictureFileVersion { get; set; }

        [InverseProperty("Resources"), ForeignKey("SiteMapNodeId")]
        public DbSiteMapNode SiteMapNode { get; set; }
    }
}
