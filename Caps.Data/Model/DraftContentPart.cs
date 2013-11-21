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

        /// <summary>
        /// The name of the content part.
        /// </summary>
        /// <remarks>
        /// The name can be used to associate the content part with a container in the template.
        /// </remarks>
        [MaxLength(50)]
        public String Name { get; set; }

        /// <summary>
        /// The type of content that this part provides.
        /// </summary>
        /// <remarks>
        /// Valid types are defined in the DraftContentTypes class.
        /// </remarks>
        [MaxLength(50)]
        public String ContentType { get; set; }

        /// <summary>
        /// Serialized properties of the content part.
        /// </summary>
        /// <remarks>
        /// This could be an XML- or JSON-Document containing properties for custom content handlers.
        /// </remarks>
        public String Properties { get; set; }

        /// <summary>
        /// The ranking for the content part.
        /// </summary>
        /// <remarks>
        /// This could be used in situations where multiple parts are displayed in the same container.
        /// </remarks>
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
