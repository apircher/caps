﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DraftFile
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int DraftId { get; set; }

        [MaxLength(50)]
        public String Name { get; set; }

        public bool IsEmbedded { get; set; }

        [MaxLength(50)]
        public String Determination { get; set; }

        [MaxLength(50)]
        public String Group { get; set; }

        public int Ranking { get; set; }

        [InverseProperty("Files"), ForeignKey("DraftId")]
        public Draft Draft { get; set; }

        [InverseProperty("DraftFile")]
        public ICollection<DraftFileResource> Resources { get; set; }
    }
}
