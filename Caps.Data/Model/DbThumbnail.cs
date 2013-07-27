using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbThumbnail
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int FileVersionId { get; set; }
        
        [MaxLength(20)]
        public byte[] OriginalFileHash { get; set; }
        [MaxLength(50)]
        public String ContentType { get; set; }
        [MaxLength(50)]
        public String Name { get; set; }

        public int Width { get; set; }
        public int Height { get; set; }

        [MaxLength(1048576)] // 1 MB
        public byte[] Data { get; set; }

        [InverseProperty("Thumbnails"), ForeignKey("FileVersionId")]
        public DbFileVersion FileVersion { get; set; }
    }
}
