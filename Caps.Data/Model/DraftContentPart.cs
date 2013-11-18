using Caps.Data.Localization;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DraftContentPart : ILocalizableEntity<DraftContentPartResource>
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        [Required]
        public int DraftId { get; set; }
        [MaxLength(50)]
        public String PartType { get; set; }
        [MaxLength(50)]
        public String ContentType { get; set; }

        public int Ranking { get; set; }

        [InverseProperty("ContentParts"), ForeignKey("DraftId")]
        public Draft Draft { get; set; }        
        [InverseProperty("ContentPart")]
        public ICollection<DraftContentPartResource> Resources { get; set; }

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
