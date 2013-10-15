using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DraftResource
    {
        [Key, Column(Order = 1)]
        public int DraftId { get; set; }
        [Key, Column(Order = 2)]
        [MaxLength(10)]
        public String Language { get; set; }

        [MaxLength(50)]
        public String Title { get; set; }
        [MaxLength(500)]
        public String Keywords { get; set; }
        [MaxLength(500)]
        public String Description { get; set; }
        
        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }

        [InverseProperty("Resources"), ForeignKey("DraftId")]
        public Draft Draft { get; set; }
    }
}
