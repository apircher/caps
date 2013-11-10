using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Data.ContentControls
{
    public class Slideshow : ContentControl
    {
        protected override XmlNode OnTransformNode(XmlNode node, string controlId, string language, DbSiteMapNode siteMapNode, ContentScriptManager scriptManager, IUrlHelper urlHelper)
        {
            var document = node.OwnerDocument;

            String fileGroup = node.GetAttributeValueOrDefault("filegroup");
            if (String.IsNullOrWhiteSpace(fileGroup))
                return document.CreateComment("Caps Slideshow: No filegroup-Attribute specified.");

            var content = siteMapNode.Content;
            if (content == null)
                return document.CreateComment(String.Format("Caps Slideshow: No content available."));

            var files = content.GetContentFiles("Picture")
                .Where(p => String.Equals(p.Group, fileGroup, StringComparison.OrdinalIgnoreCase))
                .OrderBy(p => p.Ranking)
                .ToList();

            if (files.Count == 0)
                return document.CreateComment(String.Format("Caps Slideshow: No files in group {0}.", fileGroup));

            if (files.Count == 1)
                return document.CreateSlideImage(urlHelper, files.First(), language, "caps-slide1");

            return CreateImageList(document, controlId, files, urlHelper, language);
        }

        protected virtual XmlNode CreateImageList(XmlDocument document, String controlId, IEnumerable<PublicationFile> files, IUrlHelper urlHelper, String language)
        {
            var container = document.CreateDiv(controlId, "caps-slideshow");
            var list = document.CreateElement("ul");

            foreach (var file in files)
            {
                var item = document.CreateElement("li");
                var image = document.CreateSlideImage(urlHelper, file, language, "caps-slide");
                item.AppendChild(image);
                list.AppendChild(item);
            }

            container.AppendChild(list);
            return container;
        }
    }

    static class XmlExtensions
    {
        public static XmlNode CreateSlideImage(this XmlDocument document, IUrlHelper urlHelper, PublicationFile file, String language, String cssClass)
        {
            var sqlFile = file.FileForLanguage(language, "de", "en");
            if (sqlFile == null)
                return document.CreateComment("Caps Slideshow: File not found.");

            var src = urlHelper.Action("PageContentFile", "Home", new { area = "", id = sqlFile.Id, name = sqlFile.FileName });
            return document.CreateImage(src, "", cssClass);
        }
    }
}
