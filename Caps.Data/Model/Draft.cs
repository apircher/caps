using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class Draft
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// The current version of the draft.
        /// </summary>
        public int Version { get; set; }
        
        /// <summary>
        /// The name of the draft.
        /// </summary>
        [MaxLength(50), Required]
        public String Name { get; set; }

        /// <summary>
        /// The original language of the draft.
        /// </summary>
        [Required]
        public String OriginalLanguage { get; set; }

        /// <summary>
        /// The name of the template that was used to create the draft.
        /// </summary>
        [MaxLength(50)]
        public String TemplateName { get; set; }

        /// <summary>
        /// The actual template of the draft.
        /// </summary>
        public String Template { get; set; }

        /// <summary>
        /// Serialized properties of the draft.
        /// </summary>
        /// <remarks>
        /// This could be an XML- or JSON-Document containing properties for custom content handlers.
        /// </remarks>
        public String Properties { get; set; }

        /// <summary>
        /// Editing notes for the draft.
        /// </summary>
        public String Notes { get; set; }

        /// <summary>
        /// The current status of the draft.
        /// </summary>
        [MaxLength(20)]
        public String Status { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }
        
        [InverseProperty("Draft")]
        public ICollection<DraftContentPart> ContentParts { get; set; }
        [InverseProperty("Draft")]
        public ICollection<DraftFile> Files { get; set; }
        [InverseProperty("Draft")]
        public ICollection<DraftTranslation> Translations { get; set; }
    }
}
