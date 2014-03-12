using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbFileProperty
    {
        public int FileVersionId { get; set; }
        public String PropertyName { get; set; }
        public String PropertyValue { get; set; }
    }

    public sealed class DbFileProperties
    {
        public static String ImageWidth = "width";
        public static String ImageHeight = "height";
        public static String Copyright = "copyright";
    }
}
