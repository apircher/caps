using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc.Model
{
    public class TeaserModel
    {
        public DbSiteMapNode Teaser { get; set; }
        public DbSiteMapNode TeasedContent { get; set; }
    }
}
