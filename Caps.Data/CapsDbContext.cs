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

        public DbSet<Website> Websites { get; set; }
        public DbSet<Sitemap> Sitemaps { get; set; }

        public Author GetAuthorByUserName(String userName)
        {
            return Authors.FirstOrDefault(a => a.UserName == userName);
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
