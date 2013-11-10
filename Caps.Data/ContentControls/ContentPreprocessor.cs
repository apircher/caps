using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Data.ContentControls
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
        public String Transform(String content, String contentType)
        {
            var result = ReplacePlaceholders(content);

            // Inhalts-Typ-spezifische Verarbeitung.
            if (String.Equals(contentType, DraftContentTypes.Markdown, StringComparison.OrdinalIgnoreCase))
                return ProcessMarkdown(result);
            else if (String.Equals(contentType, DraftContentTypes.Text, StringComparison.OrdinalIgnoreCase))
                return ProcessText(result);
            else
                return result;
        }
        public String PrepareDisplay(String content, String language, IUrlHelper urlHelper, ContentScriptManager scriptManager)
        {
            this.urlHelper = urlHelper;

            // Caps-XML verarbeiten.
            var result = TransformCapsControls(content, language, scriptManager);
            // Platzhalter ersetzen.
            return ReplacePlaceholders(result, language);
        }

        String TransformCapsControls(String content, String language, ContentScriptManager scriptManager)
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
                var replacement = TransformCapsControl(node, String.Format("cc{0:x}{1}", siteMapNode.Name, controlIndex++), language, scriptManager);
                if (replacement != null)
                    node.ParentNode.ReplaceChild(replacement, node);
            }

            return document.DocumentElement.InnerXml;
        }
        XmlNode TransformCapsControl(XmlNode node, String controlId, String language, ContentScriptManager scriptManager)
        {
            var capsControl = controlsRegistry.FindControl(node.LocalName);
            if (capsControl != null)
                return capsControl.TransformNode(node, controlId, language, siteMapNode, scriptManager, urlHelper);
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
<caps:content xmlns:caps=""http://schemas.pircher-software.com/caps/1"">{0}</caps:content>", content);
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
        String GetFileSrc(String key, String language, bool inline = true)
        {
            var content = siteMapNode.Content;
            if (content == null)
                return String.Empty;

            var file = content.Files.FirstOrDefault(f => String.Equals(f.Name, key, StringComparison.OrdinalIgnoreCase));
            if (file == null)
                return String.Empty;

            var sqlFile = file.FileForLanguage(language, "de", "en");
            if (sqlFile == null)
                return String.Empty;

            return urlHelper.Action("PageContentFile", "Home", new { area = "", id = sqlFile.Id, name = sqlFile.FileName, inline = inline });
        }
    }
}
