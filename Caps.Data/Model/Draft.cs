using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class Draft
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int Version { get; set; }
        [MaxLength(50)]
        public String Name { get; set; }
        [MaxLength(50)]
        public String Template { get; set; }
        public String TemplateContent { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }
        
        [InverseProperty("Draft")]
        public ICollection<DraftResource> Resources { get; set; }
        [InverseProperty("Draft")]
        public ICollection<DraftContentPart> ContentParts { get; set; }
        [InverseProperty("Draft")]
        public ICollection<DraftFile> Files { get; set; }
    }
}
