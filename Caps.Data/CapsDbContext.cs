using Caps.Data.Model;
using Microsoft.AspNet.Identity.EntityFramework;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data
{
    public class CapsDbContext : IdentityDbContext<Author>
    {
        public CapsDbContext() : base("CapsDbContext", throwIfV1Schema: false)
        {
            //Configuration.ProxyCreationEnabled = false;
            //Configuration.LazyLoadingEnabled = false;

            Database.SetInitializer<CapsDbContext>(null);

            ((System.Data.Entity.Infrastructure.IObjectContextAdapter)this).ObjectContext.ObjectMaterialized += 
                (sender, e) => Caps.Data.Utils.DateTimeKindAttribute.Apply(e.Entity);
        }

        public virtual DbSet<DbFile> Files { get; set; }
        public virtual DbSet<DbFileVersion> FileVersions { get; set; }
        public virtual DbSet<DbFileProperty> FileProperties { get; set; }
        public virtual DbSet<DbFileContent> FileContents { get; set; }
        public virtual DbSet<DbThumbnail> Thumbnails { get; set; }
        public virtual DbSet<DbFileTag> FileTags { get; set; }

        public virtual DbSet<Tag> Tags { get; set; }
        public virtual DbSet<Website> Websites { get; set; }
        public virtual DbSet<DbSiteMap> SiteMaps { get; set; }
        public virtual DbSet<DbSiteMapNode> SiteMapNodes { get; set; }
        public virtual DbSet<Publication> Publications { get; set; }

        public virtual DbSet<Draft> Drafts { get; set; }
        public virtual DbSet<DraftTranslation> DraftTranslations { get; set; }
        public virtual DbSet<DraftContentPart> DraftContentParts { get; set; }
        public virtual DbSet<DraftContentPartResource> DraftContentPartResources { get; set; }
        public virtual DbSet<DraftFile> DraftFiles { get; set; }
        public virtual DbSet<DraftFileResource> DraftFileResources { get; set; }

        public virtual DbSet<DraftTemplate> DraftTemplates { get; set; }
        
        public Author GetAuthorByUserName(String userName) 
        {
            return Users.FirstOrDefault(a => a.UserName == userName);
        }
        public DbSiteMap GetCurrentSiteMap(int websiteId)
        {
            return SiteMaps.Include("SiteMapNodes").Include("SiteMapNodes.Resources")
                .Where(m => m.PublishedFrom.HasValue && m.PublishedFrom.Value <= DateTime.UtcNow)
                .OrderByDescending(m => m.Version).ThenByDescending(m => m.PublishedFrom)
                .FirstOrDefault();
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

        public static void SetDbInitializer()
        {
            Database.SetInitializer<CapsDbContext>(new MigrateDatabaseToLatestVersion<CapsDbContext, Caps.Data.Migrations.Configuration>());
        }
    }
}
