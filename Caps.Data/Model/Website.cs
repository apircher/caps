using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class Website
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(50)]
        public String Name { get; set; }

        [MaxLength(250)]
        public String Url { get; set; }

        [InverseProperty("Website")]
        public ICollection<DbSiteMap> SiteMapVersions { get; set; }
    }
}
