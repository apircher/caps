using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbFileProperty
    {
        [Key, Column(Order = 1)]
        public int FileVersionId { get; set; }
        [Key, Column(Order = 2)]
        public String PropertyName { get; set; }

        [MaxLength(250)]
        public String PropertyValue { get; set; }
        
        [InverseProperty("Properties"), ForeignKey("FileVersionId")]
        public DbFileVersion FileVersion { get; set; }
    }

    public sealed class DbFileProperties
    {
        public static String ImageWidth = "width";
        public static String ImageHeight = "height";
        public static String Copyright = "copyright";
    }
}
