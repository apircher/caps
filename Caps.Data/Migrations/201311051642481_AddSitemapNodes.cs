namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddSitemapNodes : DbMigration
    {
        public override void Up()
        {
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
                .PrimaryKey(t => new { t.SitemapNodeContentFileId, t.Language })
                .ForeignKey("dbo.SitemapNodeContentFiles", t => t.SitemapNodeContentFileId, cascadeDelete: true)
                .ForeignKey("dbo.DbFiles", t => t.DbFileId)
                .Index(t => t.SitemapNodeContentFileId)
                .Index(t => t.DbFileId);
            
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
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.SitemapNodeContents", t => t.SitemapNodeContentId, cascadeDelete: true)
                .Index(t => t.SitemapNodeContentId);
            
            CreateTable(
                "dbo.SitemapNodeContents",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        EntityKey = c.String(maxLength: 50),
                        ContentVersion = c.Int(nullable: false),
                        ContentDate = c.String(),
                        AuthorName = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
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
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.SitemapNodeContents", t => t.SitemapNodeContentId, cascadeDelete: true)
                .Index(t => t.SitemapNodeContentId);
            
            CreateTable(
                "dbo.SitemapNodes",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        SitemapId = c.Int(nullable: false),
                        ParentNodeId = c.Int(),
                        ContentId = c.Int(nullable: false),
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
                .ForeignKey("dbo.SitemapNodes", t => t.ParentNodeId)
                .ForeignKey("dbo.SitemapNodeContents", t => t.ContentId, cascadeDelete: true)
                .ForeignKey("dbo.Sitemaps", t => t.SitemapId, cascadeDelete: true)
                .Index(t => t.ParentNodeId)
                .Index(t => t.ContentId)
                .Index(t => t.SitemapId);
            
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
                .PrimaryKey(t => new { t.SitemapNodeId, t.Language })
                .ForeignKey("dbo.SitemapNodes", t => t.SitemapNodeId, cascadeDelete: true)
                .Index(t => t.SitemapNodeId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.SitemapNodeContentFileResources", "DbFileId", "dbo.DbFiles");
            DropForeignKey("dbo.SitemapNodeContentFileResources", "SitemapNodeContentFileId", "dbo.SitemapNodeContentFiles");
            DropForeignKey("dbo.SitemapNodeContentFiles", "SitemapNodeContentId", "dbo.SitemapNodeContents");
            DropForeignKey("dbo.SitemapNodes", "SitemapId", "dbo.Sitemaps");
            DropForeignKey("dbo.SitemapNodeResources", "SitemapNodeId", "dbo.SitemapNodes");
            DropForeignKey("dbo.SitemapNodes", "ContentId", "dbo.SitemapNodeContents");
            DropForeignKey("dbo.SitemapNodes", "ParentNodeId", "dbo.SitemapNodes");
            DropForeignKey("dbo.SitemapNodeContentParts", "SitemapNodeContentId", "dbo.SitemapNodeContents");
            DropIndex("dbo.SitemapNodeContentFileResources", new[] { "DbFileId" });
            DropIndex("dbo.SitemapNodeContentFileResources", new[] { "SitemapNodeContentFileId" });
            DropIndex("dbo.SitemapNodeContentFiles", new[] { "SitemapNodeContentId" });
            DropIndex("dbo.SitemapNodes", new[] { "SitemapId" });
            DropIndex("dbo.SitemapNodeResources", new[] { "SitemapNodeId" });
            DropIndex("dbo.SitemapNodes", new[] { "ContentId" });
            DropIndex("dbo.SitemapNodes", new[] { "ParentNodeId" });
            DropIndex("dbo.SitemapNodeContentParts", new[] { "SitemapNodeContentId" });
            DropTable("dbo.SitemapNodeResources");
            DropTable("dbo.SitemapNodes");
            DropTable("dbo.SitemapNodeContentParts");
            DropTable("dbo.SitemapNodeContents");
            DropTable("dbo.SitemapNodeContentFiles");
            DropTable("dbo.SitemapNodeContentFileResources");
        }
    }
}
