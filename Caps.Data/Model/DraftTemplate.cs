using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DraftTemplate
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(50)]
        public String Name { get; set; }
        
        [Required]
        public int WebsiteId { get; set; }

        [InverseProperty("DraftTemplates"), ForeignKey("WebsiteId")]
        public Website Website { get; set; }

        [MaxLength(500)]
        public String Description { get; set; }

        public String TemplateContent { get; set; }
    }
}
