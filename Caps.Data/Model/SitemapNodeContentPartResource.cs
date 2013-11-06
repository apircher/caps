﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class SitemapNodeContentPartResource
    {
        [Key, Column(Order = 1)]
        public int SitemapNodeContentPartId { get; set; }
        [Key, Column(Order = 2)]
        [MaxLength(10)]
        public String Language { get; set; }

        public String Content { get; set; }

        public String TranslationAuthor { get; set; }
        public DateTime TranslationDate { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }

        [InverseProperty("Resources"), ForeignKey("SitemapNodeContentPartId")]
        public SitemapNodeContentPart ContentPart { get; set; }
    }
}