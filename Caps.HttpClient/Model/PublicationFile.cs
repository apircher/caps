using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class PublicationFile : ILocalizableEntity<PublicationFileResource>
    {
        public int Id { get; set; }
        public int PublicationId { get; set; }
        public String Name { get; set; }
        public bool IsEmbedded { get; set; }
        public String Determination { get; set; }
        public String Group { get; set; }
        public int Ranking { get; set; }
        public ICollection<PublicationFileResource> Resources { get; set; }

        public DbFileVersion FileVersionForLanguage(String language)
        {
            return this.GetValueForLanguage(language, r => r.FileVersion, null);
        }
        public DbFileVersion FileVersionForLanguage(String language, params String[] fallbackLanguages)
        {
            return this.GetValueForLanguage(language, r => r.FileVersion, null, fallbackLanguages);
        }
    }
}
