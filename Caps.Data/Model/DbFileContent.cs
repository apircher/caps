using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbFileContent
    {
        [Key]
        public int FileVersionId { get; set; }
        [MaxLength(52428800)] // 50 MB
        public byte[] Data { get; set; }

        [InverseProperty("Content"), ForeignKey("FileVersionId")]
        public DbFileVersion FileVersion { get; set; }
    }
}
