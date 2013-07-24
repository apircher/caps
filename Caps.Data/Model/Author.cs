using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    [Table("Author")]
    public class Author
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        [MaxLength(20), Required]
        public String UserName { get; set; }

        [MaxLength(50), Required]
        public String FirstName { get; set; }
        [MaxLength(50), Required]
        public String LastName { get; set; }

        [MaxLength(50), Required]
        public String Email { get; set; }
        [MaxLength(50)]
        public String Phone { get; set; }

        public DateTime? LastLoginDate { get; set; }
        public DateTime? LastActivityDate { get; set; }
        public String Comment { get; set; }
    }
}
