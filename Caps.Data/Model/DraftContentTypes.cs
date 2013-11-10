using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public static class DraftContentTypes
    {
        public const String Markdown = "Markdown";
        public const String Html = "Html";
        public const String Text = "Text";
        public const String CSS = "CSS";
        public const String JavaScript = "JavaScript";

        static List<DraftContentType> supportedContentTypes = new List<DraftContentType>
        {
            new DraftContentType { Name = Markdown, Title = "Markdown" },
            new DraftContentType { Name = Html, Title = "Html" },
            new DraftContentType { Name = Text, Title = "Nur Text" },
            new DraftContentType { Name = CSS, Title = "CSS" },
            new DraftContentType { Name = JavaScript, Title = "JavaScript" }
        };

        public static IEnumerable<DraftContentType> All
        {
            get
            {
                return supportedContentTypes;
            }
        }
        public static DraftContentType GetContentType(String name)
        {
            return supportedContentTypes.FirstOrDefault(t => String.Equals(t.Name, name, StringComparison.OrdinalIgnoreCase));
        }
    }

    public class DraftContentType
    {
        public String Name { get; set; }
        public String Title { get; set; }
    }
}
