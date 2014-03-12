using Caps.Consumer.ContentControls;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    /// <summary>
    /// Represents the content of a web page.
    /// </summary>
    public class ContentModel
    {
        ContentScriptManager scriptManager;

        public ContentModel()
            : this(new ContentScriptManager())
        {
        }
        public ContentModel(ContentScriptManager scriptManager)
        {
            this.scriptManager = scriptManager;
        }

        /// <summary>
        /// The associated sitemap node.
        /// </summary>
        public DbSiteMapNode SiteMapNode { get; set; }

        /// <summary>
        /// The ContentPartModel-Instances that make up the content.
        /// </summary>
        public IEnumerable<ContentPartModel> ContentParts { get; set; }

        /// <summary>
        /// Files associated with the content.
        /// </summary>
        public IEnumerable<ContentFileModel> ContentFiles { get; set; }

        /// <summary>
        /// Returns true if all ContentPart-Instances are in the
        /// current users language and false otherwise.
        /// </summary>
        public bool HasLocalizedContent
        {
            get
            {
                return ContentParts.All(c => !c.IsFallback);
            }
        }

        /// <summary>
        /// Returns the value of the content templates name-property.
        /// </summary>
        public String TemplateName
        {
            get
            {
                if (SiteMapNode == null || SiteMapNode.Content == null)
                    return null;

                dynamic template = JObject.Parse(SiteMapNode.Content.Template);
                if (template != null)
                    return template.name;
                return null;
            }
        }

        /// <summary>
        /// Returns true if a ContentPart-Instance with the given usage-value
        /// exists in this content, otherwise false.
        /// </summary>
        /// <param name="usage"></param>
        /// <param name="includeEmptyParts"></param>
        /// <returns></returns>
        public bool HasPart(String usage, bool includeEmptyParts = true)
        {
            return ContentParts != null && ContentParts.Any(p =>
            {
                if (!String.Equals(p.Usage, usage, StringComparison.OrdinalIgnoreCase))
                    return false;
                return includeEmptyParts ? true : !String.IsNullOrWhiteSpace(p.Content.Trim());
            });
        }

        /// <summary>
        /// Returns the content of the first ContentPart-Instance with the given usage-value. 
        /// </summary>
        /// <param name="usage"></param>
        /// <param name="urlHelper"></param>
        /// <returns></returns>
        public String GetPart(String usage, IUrlHelper urlHelper, ContentControlRegistry controlRegistry)
        {
            var part = FindPart(usage);
            return part != null ? part.PrepareDisplay(SiteMapNode, urlHelper, ScriptManager, controlRegistry) : String.Empty;
        }

        /// <summary>
        /// Returns the first ContentPart-Instance with the given usage-value.
        /// </summary>
        /// <param name="usage"></param>
        /// <returns></returns>
        public ContentPartModel FindPart(String usage)
        {
            return ContentParts.FirstOrDefault(p => String.Equals(p.Usage, usage, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Returns an enumerator that iterates over all the associated 
        /// files that are marked as Download.
        /// </summary>
        public IEnumerable<ContentFileModel> Downloads
        {
            get
            {
                if (ContentFiles == null || !ContentFiles.Any())
                    return new List<ContentFileModel>();
                return ContentFiles.Where(f => String.Equals(f.Determination, "Download", StringComparison.OrdinalIgnoreCase)).OrderBy(f => f.Ranking).ToList();
            }
        }

        /// <summary>
        /// Returns a ContentScriptManager-Instance that 
        /// coordinates the script-output of the ContentPart-Instances.
        /// </summary>
        public ContentScriptManager ScriptManager
        {
            get
            {
                return scriptManager;
            }
        }
    }
}
