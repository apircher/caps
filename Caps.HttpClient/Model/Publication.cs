using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class Publication
    {
        public int Id { get; set; }
        public String EntityType { get; set; }
        public String EntityKey { get; set; }
        public int ContentVersion { get; set; }
        public DateTime ContentDate { get; set; }
        public String AuthorName { get; set; }
        public String Template { get; set; }
        public String Properties { get; set; }

        public ICollection<PublicationContentPart> ContentParts { get; set; }
        public ICollection<PublicationFile> Files { get; set; }
        public ICollection<PublicationTranslation> Translations { get; set; }
        
        public IEnumerable<PublicationContentPart> GetContentParts(String name)
        {
            return ContentParts.Where(p => String.Equals(name, p.Name, StringComparison.OrdinalIgnoreCase));
        }
        public IEnumerable<PublicationFile> GetContentFiles(String determination)
        {
            return Files.Where(p => String.Equals(determination, p.Determination, StringComparison.OrdinalIgnoreCase));
        }
    }
}
