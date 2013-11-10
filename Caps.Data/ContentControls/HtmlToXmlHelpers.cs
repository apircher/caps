using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Data.ContentControls
{
    public static class HtmlToXmlHelpers
    {
        public static XmlElement CreateDiv(this XmlDocument document, String id, String cssClass)
        {
            var result = document.CreateElement("div");
            if (!String.IsNullOrWhiteSpace(id)) result.AppendAttribute("id", id);
            if (!String.IsNullOrWhiteSpace(cssClass)) result.AppendAttribute("class", cssClass);
            return result;
        }
        public static XmlElement CreateImage(this XmlDocument document, String src, String alternateText, String cssClass)
        {
            var result = document.CreateElement("img");
            if (!String.IsNullOrWhiteSpace(src)) result.AppendAttribute("src", src);
            if (!String.IsNullOrWhiteSpace(alternateText)) result.AppendAttribute("alt", alternateText);
            if (!String.IsNullOrWhiteSpace(cssClass)) result.AppendAttribute("class", cssClass);
            return result;
        }
        public static void AppendAttribute(this XmlNode node, String name, String value)
        {
            var attribute = node.OwnerDocument.CreateAttribute(name);
            attribute.Value = value;
            node.Attributes.Append(attribute);
        }

        public static String GetAttributeValueOrDefault(this XmlNode node, String attributeName, String defaultValue = "")
        {
            var attribute = node.Attributes[attributeName];
            return attribute != null ? attribute.Value : defaultValue;
        }
    }
}
