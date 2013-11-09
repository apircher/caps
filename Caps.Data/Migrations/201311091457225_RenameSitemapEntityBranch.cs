namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RenameSitemapEntityBranch : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.SitemapNodeContentPartResources", "SitemapNodeContentPartId", "dbo.SitemapNodeContentParts");
            DropForeignKey("dbo.SitemapNodeContentParts", "SitemapNodeContentId", "dbo.SitemapNodeContents");
            DropForeignKey("dbo.SitemapNodeContentFiles", "SitemapNodeContentId", "dbo.SitemapNodeContents");
            DropForeignKey("dbo.SitemapNodes", "ParentNodeId", "dbo.SitemapNodes");
            DropForeignKey("dbo.SitemapNodeResources", "SitemapNodeId", "dbo.SitemapNodes");
            DropForeignKey("dbo.Sitemaps", "WebsiteId", "dbo.Websites");
            DropForeignKey("dbo.SitemapNodes", "SitemapId", "dbo.Sitemaps");
            DropForeignKey("dbo.SitemapNodes", "ContentId", "dbo.SitemapNodeContents");
            DropForeignKey("dbo.SitemapNodeContentFileResources", "SitemapNodeContentFileId", "dbo.SitemapNodeContentFiles");
            DropForeignKey("dbo.SitemapNodeContentFileResources", "DbFileId", "dbo.DbFiles");
            DropIndex("dbo.SitemapNodeContentPartResources", new[] { "SitemapNodeContentPartId" });
            DropIndex("dbo.SitemapNodeContentParts", new[] { "SitemapNodeContentId" });
            DropIndex("dbo.SitemapNodeContentFiles", new[] { "SitemapNodeContentId" });
            DropIndex("dbo.SitemapNodes", new[] { "ParentNodeId" });
            DropIndex("dbo.SitemapNodeResources", new[] { "SitemapNodeId" });
            DropIndex("dbo.Sitemaps", new[] { "WebsiteId" });
            DropIndex("dbo.SitemapNodes", new[] { "SitemapId" });
            DropIndex("dbo.SitemapNodes", new[] { "ContentId" });
            DropIndex("dbo.SitemapNodeContentFileResources", new[] { "SitemapNodeContentFileId" });
            DropIndex("dbo.SitemapNodeContentFileResources", new[] { "DbFileId" });
            CreateTable(
                "dbo.PublicationFileResources",
                c => new
                    {
                        PublicationFileId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        DbFileId = c.Int(),
                        Title = c.String(maxLength: 50),
                        Description = c.String(),
                        Credits = c.String(maxLength: 250),
                    })
                .PrimaryKey(t => new { t.PublicationFileId, t.Language })
                .ForeignKey("dbo.PublicationFiles", t => t.PublicationFileId, cascadeDelete: true)
                .ForeignKey("dbo.DbFiles", t => t.DbFileId)
                .Index(t => t.PublicationFileId)
                .Index(t => t.DbFileId);
            
            CreateTable(
                "dbo.PublicationFiles",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        PublicationId = c.Int(nullable: false),
                        Name = c.String(maxLength: 50),
                        IsEmbedded = c.Boolean(nullable: false),
                        Determination = c.String(maxLength: 50),
                        Group = c.String(maxLength: 50),
                        Ranking = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Publications", t => t.PublicationId, cascadeDelete: true)
                .Index(t => t.PublicationId);
            
            CreateTable(
                "dbo.Publications",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        EntityType = c.String(maxLength: 50),
                        EntityKey = c.String(maxLength: 50),
                        ContentVersion = c.Int(nullable: false),
                        ContentDate = c.DateTime(nullable: false),
                        AuthorName = c.String(maxLength: 50),
                        TemplateData = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.PublicationContentParts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        PublicationId = c.Int(nullable: false),
                        PartType = c.String(maxLength: 50),
                        ContentType = c.String(maxLength: 50),
                        Ranking = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Publications", t => t.PublicationId, cascadeDelete: true)
                .Index(t => t.PublicationId);
            
            CreateTable(
                "dbo.PublicationContentPartResources",
                c => new
                    {
                        PublicationContentPartId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        Content = c.String(),
                        TranslationAuthor = c.String(),
                        TranslationDate = c.DateTime(nullable: false),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => new { t.PublicationContentPartId, t.Language })
                .ForeignKey("dbo.PublicationContentParts", t => t.PublicationContentPartId, cascadeDelete: true)
                .Index(t => t.PublicationContentPartId);
            
            CreateTable(
                "dbo.DbSiteMapNodes",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        SiteMapId = c.Int(nullable: false),
                        ParentNodeId = c.Int(),
                        ContentId = c.Int(),
                        ExternalName = c.String(maxLength: 50),
                        Ranking = c.Int(nullable: false),
                        NodeType = c.String(maxLength: 50),
                        IsDeleted = c.Boolean(nullable: false),
                        Redirect = c.String(maxLength: 250),
                        RedirectType = c.String(maxLength: 50),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.DbSiteMapNodes", t => t.ParentNodeId)
                .ForeignKey("dbo.DbSiteMaps", t => t.SiteMapId, cascadeDelete: true)
                .ForeignKey("dbo.Publications", t => t.ContentId)
                .Index(t => t.ParentNodeId)
                .Index(t => t.SiteMapId)
                .Index(t => t.ContentId);
            
            CreateTable(
                "dbo.DbSiteMapNodeResources",
                c => new
                    {
                        SiteMapNodeId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        Title = c.String(maxLength: 50),
                        Keywords = c.String(maxLength: 500),
                        Description = c.String(maxLength: 500),
                    })
                .PrimaryKey(t => new { t.SiteMapNodeId, t.Language })
                .ForeignKey("dbo.DbSiteMapNodes", t => t.SiteMapNodeId, cascadeDelete: true)
                .Index(t => t.SiteMapNodeId);
            
            CreateTable(
                "dbo.DbSiteMaps",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        WebsiteId = c.Int(nullable: false),
                        Version = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Websites", t => t.WebsiteId, cascadeDelete: true)
                .Index(t => t.WebsiteId);
            
            DropTable("dbo.SitemapNodeContentFileResources");
            DropTable("dbo.SitemapNodeContentFiles");
            DropTable("dbo.SitemapNodeContents");
            DropTable("dbo.SitemapNodeContentParts");
            DropTable("dbo.SitemapNodeContentPartResources");
            DropTable("dbo.SitemapNodes");
            DropTable("dbo.SitemapNodeResources");
            DropTable("dbo.Sitemaps");
        }
        
        public override void Down()
        {
            CreateTable(
                "dbo.Sitemaps",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        WebsiteId = c.Int(nullable: false),
                        Version = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.SitemapNodeResources",
                c => new
                    {
                        SitemapNodeId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        Title = c.String(maxLength: 50),
                        Keywords = c.String(maxLength: 500),
                        Description = c.String(maxLength: 500),
                    })
                .PrimaryKey(t => new { t.SitemapNodeId, t.Language });
            
            CreateTable(
                "dbo.SitemapNodes",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        SitemapId = c.Int(nullable: false),
                        ParentNodeId = c.Int(),
                        ContentId = c.Int(),
                        ExternalName = c.String(maxLength: 50),
                        Ranking = c.Int(nullable: false),
                        NodeType = c.String(maxLength: 50),
                        IsDeleted = c.Boolean(nullable: false),
                        Redirect = c.String(maxLength: 250),
                        RedirectType = c.String(maxLength: 50),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.SitemapNodeContentPartResources",
                c => new
                    {
                        SitemapNodeContentPartId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        Content = c.String(),
                        TranslationAuthor = c.String(),
                        TranslationDate = c.DateTime(nullable: false),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => new { t.SitemapNodeContentPartId, t.Language });
            
            CreateTable(
                "dbo.SitemapNodeContentParts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        SitemapNodeContentId = c.Int(nullable: false),
                        PartType = c.String(maxLength: 50),
                        ContentType = c.String(maxLength: 50),
                        Ranking = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.SitemapNodeContents",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        EntityType = c.String(maxLength: 50),
                        EntityKey = c.String(maxLength: 50),
                        ContentVersion = c.Int(nullable: false),
                        ContentDate = c.DateTime(nullable: false),
                        AuthorName = c.String(maxLength: 50),
                        TemplateData = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.SitemapNodeContentFiles",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        SitemapNodeContentId = c.Int(nullable: false),
                        Name = c.String(maxLength: 50),
                        IsEmbedded = c.Boolean(nullable: false),
                        Determination = c.String(maxLength: 50),
                        Group = c.String(maxLength: 50),
                        Ranking = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.SitemapNodeContentFileResources",
                c => new
                    {
                        SitemapNodeContentFileId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        DbFileId = c.Int(),
                        Title = c.String(maxLength: 50),
                        Description = c.String(),
                        Credits = c.String(maxLength: 250),
                    })
                .PrimaryKey(t => new { t.SitemapNodeContentFileId, t.Language });
            
            DropForeignKey("dbo.PublicationFileResources", "DbFileId", "dbo.DbFiles");
            DropForeignKey("dbo.PublicationFileResources", "PublicationFileId", "dbo.PublicationFiles");
            DropForeignKey("dbo.DbSiteMapNodes", "ContentId", "dbo.Publications");
            DropForeignKey("dbo.DbSiteMapNodes", "SiteMapId", "dbo.DbSiteMaps");
            DropForeignKey("dbo.DbSiteMaps", "WebsiteId", "dbo.Websites");
            DropForeignKey("dbo.DbSiteMapNodeResources", "SiteMapNodeId", "dbo.DbSiteMapNodes");
            DropForeignKey("dbo.DbSiteMapNodes", "ParentNodeId", "dbo.DbSiteMapNodes");
            DropForeignKey("dbo.PublicationFiles", "PublicationId", "dbo.Publications");
            DropForeignKey("dbo.PublicationContentParts", "PublicationId", "dbo.Publications");
            DropForeignKey("dbo.PublicationContentPartResources", "PublicationContentPartId", "dbo.PublicationContentParts");
            DropIndex("dbo.PublicationFileResources", new[] { "DbFileId" });
            DropIndex("dbo.PublicationFileResources", new[] { "PublicationFileId" });
            DropIndex("dbo.DbSiteMapNodes", new[] { "ContentId" });
            DropIndex("dbo.DbSiteMapNodes", new[] { "SiteMapId" });
            DropIndex("dbo.DbSiteMaps", new[] { "WebsiteId" });
            DropIndex("dbo.DbSiteMapNodeResources", new[] { "SiteMapNodeId" });
            DropIndex("dbo.DbSiteMapNodes", new[] { "ParentNodeId" });
            DropIndex("dbo.PublicationFiles", new[] { "PublicationId" });
            DropIndex("dbo.PublicationContentParts", new[] { "PublicationId" });
            DropIndex("dbo.PublicationContentPartResources", new[] { "PublicationContentPartId" });
            DropTable("dbo.DbSiteMaps");
            DropTable("dbo.DbSiteMapNodeResources");
            DropTable("dbo.DbSiteMapNodes");
            DropTable("dbo.PublicationContentPartResources");
            DropTable("dbo.PublicationContentParts");
            DropTable("dbo.Publications");
            DropTable("dbo.PublicationFiles");
            DropTable("dbo.PublicationFileResources");
            CreateIndex("dbo.SitemapNodeContentFileResources", "DbFileId");
            CreateIndex("dbo.SitemapNodeContentFileResources", "SitemapNodeContentFileId");
            CreateIndex("dbo.SitemapNodes", "ContentId");
            CreateIndex("dbo.SitemapNodes", "SitemapId");
            CreateIndex("dbo.Sitemaps", "WebsiteId");
            CreateIndex("dbo.SitemapNodeResources", "SitemapNodeId");
            CreateIndex("dbo.SitemapNodes", "ParentNodeId");
            CreateIndex("dbo.SitemapNodeContentFiles", "SitemapNodeContentId");
            CreateIndex("dbo.SitemapNodeContentParts", "SitemapNodeContentId");
            CreateIndex("dbo.SitemapNodeContentPartResources", "SitemapNodeContentPartId");
            AddForeignKey("dbo.SitemapNodeContentFileResources", "DbFileId", "dbo.DbFiles", "Id");
            AddForeignKey("dbo.SitemapNodeContentFileResources", "SitemapNodeContentFileId", "dbo.SitemapNodeContentFiles", "Id", cascadeDelete: true);
            AddForeignKey("dbo.SitemapNodes", "ContentId", "dbo.SitemapNodeContents", "Id");
            AddForeignKey("dbo.SitemapNodes", "SitemapId", "dbo.Sitemaps", "Id", cascadeDelete: true);
            AddForeignKey("dbo.Sitemaps", "WebsiteId", "dbo.Websites", "Id", cascadeDelete: true);
            AddForeignKey("dbo.SitemapNodeResources", "SitemapNodeId", "dbo.SitemapNodes", "Id", cascadeDelete: true);
            AddForeignKey("dbo.SitemapNodes", "ParentNodeId", "dbo.SitemapNodes", "Id");
            AddForeignKey("dbo.SitemapNodeContentFiles", "SitemapNodeContentId", "dbo.SitemapNodeContents", "Id", cascadeDelete: true);
            AddForeignKey("dbo.SitemapNodeContentParts", "SitemapNodeContentId", "dbo.SitemapNodeContents", "Id", cascadeDelete: true);
            AddForeignKey("dbo.SitemapNodeContentPartResources", "SitemapNodeContentPartId", "dbo.SitemapNodeContentParts", "Id", cascadeDelete: true);
        }
    }
}
