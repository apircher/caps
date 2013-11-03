using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DraftFileResource
    {
        [Key, Column(Order = 1)]
        public int DraftFileId { get; set; }
        
        [Key, Column(Order = 2)]
        [MaxLength(10)]
        public String Language { get; set; }

        public int? DbFileId { get; set; }
        
        [MaxLength(50)]
        public String Title { get; set; }
        
        public String Description { get; set; }
        
        [MaxLength(250)]
        public String Credits { get; set; }

        [InverseProperty("Resources"), ForeignKey("DraftFileId")]
        public DraftFile DraftFile { get; set; }
        
        [InverseProperty("DraftFileResources"), ForeignKey("DbFileId")]
        public DbFile File { get; set; }

    }
}
