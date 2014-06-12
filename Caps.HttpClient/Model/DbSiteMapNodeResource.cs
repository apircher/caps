using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbSiteMapNodeResource : ILocalizedResource
    {
        public int SiteMapNodeId { get; set; }
        public String Language { get; set; }
        public String Title { get; set; }
        public String Keywords { get; set; }
        public String Description { get; set; }
        public int? PictureFileVersionId { get; set; }
        public DbFileVersion PictureFileVersion { get; set; }
    }
}
