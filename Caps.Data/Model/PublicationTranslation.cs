using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class PublicationTranslation
    {
        [Key, Column(Order = 1)]
        public int PublicationId { get; set; }

        [Key, Column(Order = 2)]
        [MaxLength(10)]
        public String Language { get; set; }

        public int ContentVersion { get; set; }

        public DateTime ContentDate { get; set; }

        [MaxLength(50)]
        public String AuthorName { get; set; }
        
        [InverseProperty("Translations"), ForeignKey("PublicationId")]
        public Publication Publication { get; set; }
    }
}
