﻿using Caps.Consumer.Model;
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
        protected override XmlNode OnTransformNode(XmlNode node, string controlId, string language, DbSiteMapNode siteMapNode, ContentScriptManager scriptManager, IUrlHelper urlHelper)
        {
            var document = node.OwnerDocument;

            String fileGroup = node.GetAttributeValueOrDefault("filegroup");
            if (String.IsNullOrWhiteSpace(fileGroup))
                return document.CreateComment("Caps Slideshow: No filegroup-Attribute specified.");

            String size = node.GetAttributeValueOrDefault("size");
            if (String.IsNullOrWhiteSpace(size))
                size = "300x300";
            

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
            {
                var file = files.First();
                var container = document.CreateDiv(controlId, "caps-slideshow");
                container.AppendChild(document.CreateSlideImage(file, language, GetSlideImageSrc(urlHelper, file, language, size), "caps-slide1"));
                return container;
            }

            return CreateImageList(document, controlId, files, size, urlHelper, language);
        }

        protected virtual XmlNode CreateImageList(XmlDocument document, String controlId, IEnumerable<PublicationFile> files, String imageSize, IUrlHelper urlHelper, String language)
        {
            var container = document.CreateDiv(controlId, "caps-slideshow");
            var list = document.CreateElement("ul");

            foreach (var file in files)
            {
                var item = document.CreateElement("li");
                var image = CreateSlideImage(document, file, language, imageSize, GetSlideImageSrc(urlHelper, file, language, imageSize), urlHelper);
                item.AppendChild(image);
                list.AppendChild(item);
            }

            container.AppendChild(list);
            return container;
        }

        protected virtual XmlNode CreateSlideImage(XmlDocument document, PublicationFile file, String language, String size, String src, IUrlHelper urlHelper)
        {
            return document.CreateSlideImage(file, language, GetSlideImageSrc(urlHelper, file, language, size), "caps-slide");
        }

        protected virtual String GetSlideImageSrc(IUrlHelper urlHelper, PublicationFile file, String language, String size)
        {
            var sqlFile = file.FileVersionForLanguage(language, "de", "en");
            return urlHelper.Action("Thumbnail", "Caps", new
            {
                id = sqlFile.Id,
                name = System.Web.HttpUtility.UrlEncode(sqlFile.File.FileName),
                size = size,
                v = Convert.ToBase64String(sqlFile.Hash),
                language = language
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
            return document.CreateImage(src, title, cssClass);
        }
    }
}
