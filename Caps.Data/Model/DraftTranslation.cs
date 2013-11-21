using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DraftTranslation
    {
        [Key, Column(Order = 1)]
        public int DraftId { get; set; }

        [Key, Column(Order = 2)]
        [MaxLength(10)]
        public String Language { get; set; }
        
        public int Version { get; set; }

        [MaxLength(50)]
        public String TranslatedName { get; set; }

        [MaxLength(20)]
        public String Status { get; set; }
        
        public ChangeInfo Created { get; set; }
        
        public ChangeInfo Modified { get; set; }

        [InverseProperty("Translations"), ForeignKey("DraftId")]
        public Draft Draft { get; set; }
    }
}
