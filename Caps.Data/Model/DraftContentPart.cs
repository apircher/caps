using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DraftContentPart
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        [Required]
        public int DraftId { get; set; }
        [MaxLength(50)]
        public String PartType { get; set; }
        [MaxLength(50)]
        public String ContentType { get; set; }

        public int Ranking { get; set; }

        [InverseProperty("ContentParts"), ForeignKey("DraftId")]
        public Draft Draft { get; set; }        
        [InverseProperty("ContentPart")]
        public ICollection<DraftContentPartResource> Resources { get; set; }
    }
}
