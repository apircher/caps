﻿using Caps.Consumer.Model;
using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Consumer.ContentControls
{
    public class ContentPreprocessor
    {
        DbSiteMapNode siteMapNode;
        IUrlHelper urlHelper;
        ContentControlRegistry controlsRegistry;

        public ContentPreprocessor(DbSiteMapNode siteMapNode, ContentControlRegistry controlsRegistry)
        {
            this.siteMapNode = siteMapNode;
            this.controlsRegistry = controlsRegistry;
        }

        public String PrepareDisplay(String scopeId, String content, String language, IUrlHelper urlHelper, ContentScriptManager scriptManager)
        {
            this.urlHelper = urlHelper;

            // Process Caps-XML.
            var result = TransformCapsControls(scopeId, content, language, scriptManager);
            // Replace placeholders
            result = ReplacePlaceholders(result, language);
            // Replace content references
            return ReplaceContentReferences(result, language);
        }

        String TransformCapsControls(String scopeId, String content, String language, ContentScriptManager scriptManager)
        {
            var document = new XmlDocument();
            var namespaceManager = new XmlNamespaceManager(document.NameTable);
            namespaceManager.AddNamespace("caps", "http://schemas.pircher-software.com/caps/1");
            try
            {
                document.LoadXml(WrapContent(content));
            }
            catch (XmlException)
            {
                return content;
            }

            var capsNodes = document.SelectNodes("caps:content//caps:*", namespaceManager);
            int controlIndex = 1;
            foreach (XmlNode node in capsNodes)
            {
                var controlId = scriptManager.GetUniqueId(scopeId, siteMapNode.ContentId.GetValueOrDefault(), controlIndex++);
                var replacement = TransformCapsControl(node, controlId, language, scriptManager);
                if (replacement != null)
                    node.ParentNode.ReplaceChild(replacement, node);
            }

            return document.DocumentElement.InnerXml;
        }
        XmlNode TransformCapsControl(XmlNode node, String controlId, String language, ContentScriptManager scriptManager)
        {
            var capsControl = controlsRegistry.FindControl(node.LocalName);
            if (capsControl != null)
            {
                var context = new ControlContext
                {
                    Node = node,
                    ControlId = controlId,
                    Language = language,
                    SiteMapNode = siteMapNode,
                    ScriptManager = scriptManager,
                    UrlHelper = urlHelper
                };
                return capsControl.TransformNode(context);
            }
            return null;
        }
        String WrapContent(String content)
        {
            return String.Format(@"<!DOCTYPE documentElement[ 
<!ENTITY nbsp ""&#160;""> 
<!ENTITY Auml ""&#196;"">
<!ENTITY auml ""&#228;"">
<!ENTITY Ouml ""&#214;"">
<!ENTITY ouml ""&#246;"">
<!ENTITY Uuml ""&#220;"">
<!ENTITY uuml ""&#252;"">
]> 
<caps:content xmlns:caps=""http://schemas.pircher-software.com/caps/1"">{0}</caps:content>", ConvertToXhtml(content));
        }
        String ConvertToXhtml(String content)
        {
            var rx = new Regex(@"<br\s*>", RegexOptions.IgnoreCase);
            content = rx.Replace(content, "<br />");

            return content;
        }

        String ProcessMarkdown(String content)
        {
            return content; // new MarkdownSharp.Markdown().Transform(content);
        }
        String ProcessText(String content)
        {
            return content; // HttpUtility.HtmlEncode(content);
        }

        String ReplacePlaceholders(String content, String language = null)
        {
            var rx = new Regex(@"<%\s*((?'type'datei|file|download):\s*(?'key'[\.A-Za-z0-9_-]+))\s*%>", RegexOptions.IgnoreCase);
            if (rx.IsMatch(content))
            {
                content = rx.Replace(content, new MatchEvaluator(m =>
                {
                    var placeHolderType = m.Groups["type"].Value;
                    var key = m.Groups["key"].Value;

                    if (String.Equals(placeHolderType, "datei", StringComparison.OrdinalIgnoreCase) || String.Equals(placeHolderType, "file", StringComparison.OrdinalIgnoreCase))
                        return GetFileSrc(key, language);
                    else if (String.Equals(placeHolderType, "download", StringComparison.OrdinalIgnoreCase))
                        return GetFileSrc(key, language, false);

                    return String.Empty;
                }));
            }

            return content;
        }

        String ReplaceContentReferences(String content, String language = null)
        {
            var rx = new Regex(@"caps:\/\/content-file\/(?'fileName'[^""'\s\?)]*)(?'query'\?[^""'\s)]*)?", RegexOptions.IgnoreCase);
            if (rx.IsMatch(content))
                content = rx.Replace(content, new MatchEvaluator(m => ReplaceFileReference(m, language)));

            rx = new Regex(@"caps:\/\/publication\/(?'id'\d+)(-([a-zA-Z]{2,5}))?(\?[^""'\s)]*)?", RegexOptions.IgnoreCase);
            if (rx.IsMatch(content))
                content = rx.Replace(content, new MatchEvaluator(m => ReplacePublicationReference(m, language)));

            return content;
        }

        String ReplaceFileReference(Match match, String language)
        {
            var fileName = System.Web.HttpUtility.UrlDecode(match.Groups["fileName"].Value);
            var query = match.Groups["query"].Value;

            if (Regex.IsMatch(query, @"(\?|&amp;|&)download=1"))
                return GetFileSrc(fileName, language, false);

            if (Regex.IsMatch(query, @"(\?|&amp;|&)thumbnail=1", RegexOptions.IgnoreCase) || Regex.IsMatch(query, @"(\?|&amp;|&)size=", RegexOptions.IgnoreCase))
            {
                var sizeRegex = new Regex(@"(\?|&amp;|&)size=(?'size'[0-9]+x[0-9]+)", RegexOptions.IgnoreCase);
                var size = "200x160";
                MatchCollection sizeMatches = sizeRegex.Matches(query);
                if (sizeMatches.Count > 0)
                    size = sizeMatches[0].Groups["size"].Value;

                var fitModeRegex = new Regex(@"(\?|&amp;|&)fitMode=(?'fitMode'[^&]+)", RegexOptions.IgnoreCase);
                var fitMode = "Default";
                MatchCollection fitModeMatches = fitModeRegex.Matches(query);
                if (fitModeMatches.Count > 0)
                    fitMode = fitModeMatches[0].Groups["fitMode"].Value;

                var scaleModeRegex = new Regex(@"(\?|&amp;|&)scaleMode=(?'scaleMode'[^&]+)", RegexOptions.IgnoreCase);
                var scaleMode = "Default";
                MatchCollection scaleModeMatches = scaleModeRegex.Matches(query);
                if (scaleModeMatches.Count > 0)
                    scaleMode = scaleModeMatches[0].Groups["scaleMode"].Value;

                return GetThumbnailSrc(fileName, language, size, fitMode, scaleMode);
            }
            return GetFileSrc(fileName, language, true);
        }

        String ReplacePublicationReference(Match match, String language)
        {
            int permanentId = int.Parse(match.Groups["id"].Value);
            return urlHelper.Publication(permanentId);
        }

        String GetFileSrc(String key, String language, bool inline = true)
        {
            var content = siteMapNode.Content;
            if (content == null)
                return String.Empty;

            var file = content.Files.FirstOrDefault(f => String.Equals(f.Name, key, StringComparison.OrdinalIgnoreCase));
            if (file == null)
                return String.Empty;

            var sqlFile = file.FileVersionForLanguage(language, "de", "en");
            if (sqlFile == null)
                return String.Empty;

            return urlHelper.Action("ContentFile", "Caps", new
            {
                area = "",
                id = sqlFile.Id,
                name = sqlFile.File.FileName,
                inline = inline
            });
        }

        String GetThumbnailSrc(String key, String language, String size, String fitMode, String scaleMode)
        {
            var content = siteMapNode.Content;
            if (content == null)
                return String.Empty;

            var file = content.Files.FirstOrDefault(f => String.Equals(f.Name, key, StringComparison.OrdinalIgnoreCase));
            if (file == null)
                return String.Empty;

            var sqlFile = file.FileVersionForLanguage(language, "de", "en");
            if (sqlFile == null)
                return String.Empty;

            return urlHelper.Action("Thumbnail", "Caps", new
            {
                area = "",
                id = sqlFile.Id,
                name = sqlFile.File.FileName,
                size = size,
                fitMode = fitMode,
                scaleMode = scaleMode,
                v = Convert.ToBase64String(sqlFile.Hash)
            });
        }
    }
}
