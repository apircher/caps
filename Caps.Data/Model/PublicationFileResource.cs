﻿using Caps.Data.Localization;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class PublicationFileResource : ILocalizedResource
    {
        [Key, Column(Order = 1)]
        public int PublicationFileId { get; set; }

        [Key, Column(Order = 2)]
        [MaxLength(10)]
        public String Language { get; set; }
                
        public int? DbFileVersionId { get; set; }

        [MaxLength(50)]
        public String Title { get; set; }

        public String Description { get; set; }

        [MaxLength(250)]
        public String Credits { get; set; }

        [InverseProperty("Resources"), ForeignKey("PublicationFileId")]
        public PublicationFile PublicationFile { get; set; }

        [InverseProperty("PublicationFileResources"), ForeignKey("DbFileVersionId")]
        public DbFileVersion FileVersion { get; set; }
    }
}
