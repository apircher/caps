using Caps.Consumer.ContentControls;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    /// <summary>
    /// Represents the content of a certain layout cell.
    /// </summary>
    public class ContentPartModel
    {
        /// <summary>
        /// The raw content of the layout cell.
        /// </summary>
        public String Content { get; set; }
        /// <summary>
        /// The language of the cells content.
        /// </summary>
        public String Language { get; set; }
        /// <summary>
        /// The usage of the content. Actually this can be seen as the cell name.
        /// </summary>
        public String Usage { get; set; }
        /// <summary>
        /// A boolean value that holds true if the content is in a fallback language
        /// instead of in the requested language. Otherwise it holds false.
        /// </summary>
        public bool IsFallback { get; set; }

        /// <summary>
        /// Returns the content of the layout cell prepared for display.
        /// </summary>
        /// <param name="node"></param>
        /// <param name="urlHelper"></param>
        /// <param name="scriptManager"></param>
        /// <returns></returns>
        public String PrepareDisplay(DbSiteMapNode node, IUrlHelper urlHelper, ContentScriptManager scriptManager, ContentControlRegistry controlRegistry)
        {
            var result = Content;
            if (!String.IsNullOrWhiteSpace(result))
            {
                var pp = new ContentPreprocessor(node, controlRegistry);
                result = pp.PrepareDisplay(Usage, result, Language, urlHelper, scriptManager);
            }
            return result;
        }
    }
}
