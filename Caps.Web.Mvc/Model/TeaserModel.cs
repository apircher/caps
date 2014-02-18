using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc.Model
{
    /// <summary>
    /// Represents a content teaser.
    /// </summary>
    public class TeaserModel
    {
        /// <summary>
        /// The sitemap node representing the teaser.
        /// </summary>
        public DbSiteMapNode Teaser { get; set; }
        /// <summary>
        /// The sitemap node representing the teased content.
        /// </summary>
        public DbSiteMapNode TeasedContent { get; set; }
    }
}
