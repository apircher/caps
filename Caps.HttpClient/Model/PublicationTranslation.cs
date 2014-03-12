using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class PublicationTranslation
    {
        public int PublicationId { get; set; }
        public String Language { get; set; }
        public int ContentVersion { get; set; }
        public DateTime ContentDate { get; set; }
        public String AuthorName { get; set; }
    }
}
