using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class PublicationContentPart : ILocalizableEntity<PublicationContentPartResource>
    {
        public int Id { get; set; }
        public int PublicationId { get; set; }
        public String Name { get; set; }
        public String ContentType { get; set; }
        public String Properties { get; set; }
        public int Ranking { get; set; }
        public ICollection<PublicationContentPartResource> Resources { get; set; }

        public String ContentForLanguage(String language)
        {
            return this.GetValueForLanguage(language, r => r.Content, null);
        }
        public String ContentForLanguage(String language, params String[] fallbackLanguages)
        {
            return this.GetValueForLanguage(language, r => r.Content, null, fallbackLanguages);
        }
    }
}
