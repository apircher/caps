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

        /// <summary>
        /// The type of entity that has been published.
        /// </summary>
        [MaxLength(50)]
        public String EntityType { get; set; }

        /// <summary>
        /// The key of the published entity.
        /// </summary>
        [MaxLength(50)]
        public String EntityKey { get; set; }

        /// <summary>
        /// The version that the entity was published with.
        /// </summary>
        public int ContentVersion { get; set; }

        /// <summary>
        /// The last modification date of the entity at the time it was published.
        /// </summary>
        public DateTime ContentDate { get; set; }

        /// <summary>
        /// The author name of the publication.
        /// </summary>
        [MaxLength(50)]
        public String AuthorName { get; set; }

        /// <summary>
        /// JSON-Document describing the template for displaying the content.
        /// </summary>
        /// <remarks>
        /// This template contains metadata about the content parts and files that can be expected in this publication
        /// </remarks>
        public String Template { get; set; }

        /// <summary>
        /// Serialized properties of the publication.
        /// </summary>
        /// <remarks>
        /// This could be an XML- or JSON-Document containing properties for custom content handlers.
        /// </remarks>
        public String Properties { get; set; }

        [InverseProperty("Content")]
        public ICollection<DbSiteMapNode> SiteMapNodes { get; set; }
        [InverseProperty("Publication")]
        public ICollection<PublicationContentPart> ContentParts { get; set; }
        [InverseProperty("Publication")]
        public ICollection<PublicationFile> Files { get; set; }
        [InverseProperty("Publication")]
        public ICollection<PublicationTranslation> Translations { get; set; }
        
        public IEnumerable<PublicationContentPart> GetContentParts(String name)
        {
            return ContentParts.Where(p => String.Equals(name, p.Name, StringComparison.OrdinalIgnoreCase));
        }
        public IEnumerable<PublicationFile> GetContentFiles(String determination)
        {
            return Files.Where(p => String.Equals(determination, p.Determination, StringComparison.OrdinalIgnoreCase));
        }
    }
}
