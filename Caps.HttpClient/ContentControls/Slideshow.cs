using Caps.Consumer.Model;
using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Consumer.ContentControls
{
    public class Slideshow : ContentControl
    {
        protected override XmlNode OnTransformNode(ControlContext context)
        {
            var node = context.Node;
            var siteMapNode = context.SiteMapNode;
            var controlId = context.ControlId;
            var language = context.Language;
            var urlHelper = context.UrlHelper;

            var document = node.OwnerDocument;

            String fileGroupSelector = node.GetAttributeValueOrDefault("filegroup");
            if (String.IsNullOrWhiteSpace(fileGroupSelector))
                return document.CreateComment("Caps Slideshow: No filegroup-Attribute specified.");

            String size = node.GetAttributeValueOrDefault("size");
            if (String.IsNullOrWhiteSpace(size))
                size = "300x300";
            

            var content = siteMapNode.Content;
            if (content == null)
                return document.CreateComment(String.Format("Caps Slideshow: No content available."));

            var files = SelectFiles(content, fileGroupSelector).ToList();

            if (files.Count == 0)
                return document.CreateComment(String.Format("Caps Slideshow: No slides found for '{0}'.", fileGroupSelector));

            if (files.Count == 1)
            {
                var file = files.First();
                var container = document.CreateDiv(controlId, "caps-slideshow");
                container.AppendChild(document.CreateSlideImage(file, language, GetSlideImageSrc(context, file, size), "caps-slide1"));
                return container;
            }

            return CreateImageList(context, files, size);
        }

        protected virtual IEnumerable<PublicationFile> SelectFiles(Publication publication, XmlNode node) 
        {
            var fileGroupSelector = node.GetAttributeValueOrDefault("filegroup");
            if (String.IsNullOrWhiteSpace(fileGroupSelector))
                return null;
            return SelectFiles(publication, fileGroupSelector);
        }

        protected virtual IEnumerable<PublicationFile> SelectFiles(Publication publication, String fileGroupSelector) 
        {
            var groupNames = fileGroupSelector.Split(',').Select(s => s.Trim());
            return publication.GetContentFiles("Picture")
                .Where(p => groupNames.Any(gn => String.Equals(p.Group, gn, StringComparison.OrdinalIgnoreCase)))
                .OrderBy(p => p.Ranking);
        }

        protected virtual XmlNode CreateImageList(ControlContext context, IEnumerable<PublicationFile> files, String imageSize) 
        {
            var document = context.Document;
            var container = document.CreateDiv(context.ControlId, "caps-slideshow");
            var list = document.CreateElement("ul");

            foreach (var file in files)
            {
                var item = document.CreateElement("li");
                var image = CreateSlideImage(context, file, imageSize, GetSlideImageSrc(context, file, imageSize));
                item.AppendChild(image);
                list.AppendChild(item);
            }

            container.AppendChild(list);
            return container;
        }

        protected virtual XmlNode CreateSlideImage(ControlContext context, PublicationFile file, String size, String src) 
        {
            return context.Document.CreateSlideImage(file, context.Language, GetSlideImageSrc(context, file, size), "caps-slide");
        }

        protected virtual String GetSlideImageSrc(ControlContext context, PublicationFile file, String size) 
        {
            var sqlFile = file.FileVersionForLanguage(context.Language, "de", "en");
            return context.UrlHelper.Action("Thumbnail", "Caps", new
            {
                id = sqlFile.Id,
                name = sqlFile.File.FileName,
                size = size,
                v = Convert.ToBase64String(sqlFile.Hash),
                language = context.Language
            });
        }
    }

    static class XmlExtensions
    {
        public static XmlNode CreateSlideImage(this XmlDocument document, PublicationFile file, String language, String src, String cssClass)
        {
            var sqlFile = file.FileVersionForLanguage(language, "de", "en");
            if (sqlFile == null)
                return document.CreateComment("Caps Slideshow: File not found.");
            var title = file.GetValueForLanguage(language, r => r.Title, "en", "de");
            var imgNode = document.CreateImage(src, title, cssClass);

            if (!String.IsNullOrWhiteSpace(title))
                imgNode.AppendAttribute("data-title", title);

            var descripion = file.GetValueForLanguage(language, r => r.Description, "en", "de");
            if (!String.IsNullOrWhiteSpace(descripion))
                imgNode.AppendAttribute("data-description", descripion);

            imgNode.AppendAttribute("data-group", file.Group);
            return imgNode;
        }
    }
}
