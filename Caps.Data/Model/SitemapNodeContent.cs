﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class SitemapNodeContent
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(50)]
        public String EntityKey { get; set; }

        public int ContentVersion { get; set; }

        public String ContentDate { get; set; }

        public String AuthorName { get; set; }

        [InverseProperty("Content")]
        public ICollection<SitemapNode> SitemapNodes { get; set; }

        [InverseProperty("SitemapNodeContent")]
        public ICollection<SitemapNodeContentPart> ContentParts { get; set; }

        [InverseProperty("SitemapNodeContent")]
        public ICollection<SitemapNodeContentFile> Files { get; set; }
    }
}
