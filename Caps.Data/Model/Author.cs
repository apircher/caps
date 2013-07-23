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
        public String UserName { get; set; }

        public String FirstName { get; set; }
        public String LastName { get; set; }

        public String Email { get; set; }

        public DateTime? LastLoginDate { get; set; }
        public DateTime? LastActivityDate { get; set; }
        public String Comment { get; set; }
    }
}
