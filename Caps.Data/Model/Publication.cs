using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class Publication
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(50)]
        public String EntityType { get; set; }

        [MaxLength(50)]
        public String EntityKey { get; set; }

        public int ContentVersion { get; set; }

        public DateTime ContentDate { get; set; }

        [MaxLength(50)]
        public String AuthorName { get; set; }

        public String TemplateData { get; set; }

        [InverseProperty("Content")]
        public ICollection<DbSiteMapNode> SiteMapNodes { get; set; }

        [InverseProperty("Publication")]
        public ICollection<PublicationContentPart> ContentParts { get; set; }

        [InverseProperty("Publication")]
        public ICollection<PublicationFile> Files { get; set; }
        
        public IEnumerable<PublicationContentPart> GetContentParts(String partType)
        {
            return ContentParts.Where(p => String.Equals(partType, p.PartType, StringComparison.OrdinalIgnoreCase));
        }

        public IEnumerable<PublicationFile> GetContentFiles(String determination)
        {
            return Files.Where(p => String.Equals(determination, p.Determination, StringComparison.OrdinalIgnoreCase));
        }
    }
}
