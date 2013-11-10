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
    public class PublicationContentPart : ILocalizableEntity<PublicationContentPartResource>
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int PublicationId { get; set; }

        [InverseProperty("ContentParts"), ForeignKey("PublicationId")]
        public Publication Publication { get; set; }
        
        [MaxLength(50)]
        public String PartType { get; set; }

        [MaxLength(50)]
        public String ContentType { get; set; }

        public int Ranking { get; set; }

        [InverseProperty("ContentPart")]
        public ICollection<PublicationContentPartResource> Resources { get; set; }
    }
}
