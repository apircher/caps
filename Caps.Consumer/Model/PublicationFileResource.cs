using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class PublicationFileResource : ILocalizedResource
    {
        public int PublicationFileId { get; set; }
        public String Language { get; set; }
        public int? DbFileVersionId { get; set; }
        public String Title { get; set; }
        public String Description { get; set; }
        public String Credits { get; set; }
        public DbFileVersion FileVersion { get; set; }
    }
}
