using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    /// <summary>
    /// Defines possible values for the DraftContentPart.ContentType-Property.
    /// </summary>
    public static class DraftContentTypes
    {
        /// <summary>
        /// The content part contains Markdown.
        /// </summary>
        public const String Markdown = "Markdown";
        /// <summary>
        /// The content part contains Html.
        /// </summary>
        public const String Html = "Html";
        /// <summary>
        /// The content part contains Text.
        /// </summary>
        public const String Text = "Text";
        /// <summary>
        /// The content part contains CSS definitions.
        /// </summary>
        public const String CSS = "CSS";
        /// <summary>
        /// The content part contains Javascript code.
        /// </summary>
        public const String JavaScript = "JavaScript";
        /// <summary>
        /// The content part contains custom content handled by a plugin.
        /// </summary>
        public const String Custom = "Custom";

        static List<DraftContentType> supportedContentTypes = new List<DraftContentType>
        {
            new DraftContentType { Name = Markdown, Title = "Markdown" },
            new DraftContentType { Name = Html, Title = "Html" },
            new DraftContentType { Name = Text, Title = "Nur Text" },
            new DraftContentType { Name = CSS, Title = "CSS" },
            new DraftContentType { Name = JavaScript, Title = "JavaScript" },
            new DraftContentType { Name = Custom, Title = "Benutzerdefiniert" }
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
