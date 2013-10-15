using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbFile
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(50)]
        public String FileName { get; set; }
        [MaxLength(50)]
        public String ContentType { get; set; }

        [InverseProperty("File")]
        public ICollection<DbFileVersion> Versions { get; set; }
        [InverseProperty("File")]
        public ICollection<DbFileTag> Tags { get; set; }
        [InverseProperty("File")]
        public ICollection<DraftFileResource> DraftFileResources { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }

        [NotMapped]
        public bool IsImage
        {
            get
            {
                if (String.IsNullOrWhiteSpace(ContentType))
                    return false;
                return ContentType.StartsWith("image");
            }
        }

        public DbFileVersion GetLatestVersion()
        {
            return Versions != null ? Versions.OrderByDescending(v => v.Id).FirstOrDefault() : null;
        }
    }
}
