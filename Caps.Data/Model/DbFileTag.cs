using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbFileTag
    {
        [Key, Column(Order = 1)]
        public int FileId { get; set; }
        [Key, Column(Order = 2)]
        public int TagId { get; set; }

        [InverseProperty("Tags"), ForeignKey("FileId")]
        public DbFile File { get; set; }
        [InverseProperty("Files"), ForeignKey("TagId")]
        public Tag Tag { get; set; }
    }
}
