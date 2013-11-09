using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class PublicationFile
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int PublicationId { get; set; }

        [InverseProperty("Files"), ForeignKey("PublicationId")]
        public Publication Publication { get; set; }
        
        [MaxLength(50)]
        public String Name { get; set; }

        public bool IsEmbedded { get; set; }

        [MaxLength(50)]
        public String Determination { get; set; }

        [MaxLength(50)]
        public String Group { get; set; }

        public int Ranking { get; set; }

        [InverseProperty("PublicationFile")]
        public ICollection<PublicationFileResource> Resources { get; set; }
    }
}
