using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data
{
    public class CapsDbContext : DbContext
    {
        public CapsDbContext() : base("CapsDbContext")
        {
            Configuration.ProxyCreationEnabled = false;
            Configuration.LazyLoadingEnabled = false;
        }

        public DbSet<Author> Authors { get; set; }

        public DbSet<DbFile> Files { get; set; }
        public DbSet<DbFileVersion> FileVersions { get; set; }
        public DbSet<DbFileProperty> FileProperties { get; set; }
        public DbSet<DbFileContent> FileContents { get; set; }
        public DbSet<DbThumbnail> Thumbnails { get; set; }
        public DbSet<DbFileTag> FileTags { get; set; }

        public DbSet<Tag> Tags { get; set; }
        public DbSet<Website> Websites { get; set; }
        public DbSet<Sitemap> Sitemaps { get; set; }
        public DbSet<SitemapNode> SitemapNodes { get; set; }

        public DbSet<Draft> Drafts { get; set; }
        public DbSet<DraftResource> DraftResources { get; set; }
        public DbSet<DraftContentPart> DraftContentParts { get; set; }
        public DbSet<DraftContentPartResource> DraftContentPartResources { get; set; }
        public DbSet<DraftFile> DraftFiles { get; set; }
        public DbSet<DraftFileResource> DraftFileResources { get; set; }
        
        public Author GetAuthorByUserName(String userName)
        {
            return Authors.FirstOrDefault(a => a.UserName == userName);
        }

        public Tag GetOrCreateTag(String name)
        {
            var tag = Tags.FirstOrDefault(t => t.Name.ToLower() == name.ToLower());
            if (tag == null)
            {
                tag = new Tag { Name = name };
                Tags.Add(tag);
            }
            return tag;
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DbFileVersion>()
                .HasRequired<DbFileContent>(x => x.Content)
                .WithRequiredPrincipal();

            base.OnModelCreating(modelBuilder);
        }
    }
}
