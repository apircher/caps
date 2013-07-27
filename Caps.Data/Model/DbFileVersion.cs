using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbFileVersion
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        [Required]
        public int FileId { get; set; }
        public int FileSize { get; set; }

        [MaxLength(20)]
        public byte[] Hash { get; set; }

        public String Notes { get; set; }

        [InverseProperty("Versions"), ForeignKey("FileId")]
        public DbFile File { get; set; }
        [InverseProperty("FileVersion")]
        public DbFileContent Content { get; set; }
        [InverseProperty("FileVersion")]
        public ICollection<DbThumbnail> Thumbnails { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }
    }
}
