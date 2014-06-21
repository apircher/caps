using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class PublicationContentPartResource : ILocalizedResource
    {
        public int PublicationContentPartId { get; set; }
        public String Language { get; set; }
        public String Content { get; set; }
    }
}
