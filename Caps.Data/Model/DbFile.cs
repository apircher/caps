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

        public String Description { get; set; }

        [InverseProperty("File")]
        public ICollection<DbFileVersion> Versions { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }
    }
}
