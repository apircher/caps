namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddDrafts : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.DraftFileResources",
                c => new
                    {
                        DraftFileId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        DbFileId = c.Int(nullable: false),
                        Title = c.String(maxLength: 50),
                        Description = c.String(),
                        Credits = c.String(maxLength: 250),
                    })
                .PrimaryKey(t => new { t.DraftFileId, t.Language })
                .ForeignKey("dbo.DraftFiles", t => t.DraftFileId, cascadeDelete: true)
                .ForeignKey("dbo.DbFiles", t => t.DbFileId, cascadeDelete: true)
                .Index(t => t.DraftFileId)
                .Index(t => t.DbFileId);
            
            CreateTable(
                "dbo.DraftFiles",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        DraftId = c.Int(nullable: false),
                        Name = c.String(maxLength: 50),
                        IsEmbedded = c.Boolean(nullable: false),
                        Determination = c.String(maxLength: 50),
                        Group = c.String(maxLength: 50),
                        Ranking = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Drafts", t => t.DraftId, cascadeDelete: true)
                .Index(t => t.DraftId);
            
            CreateTable(
                "dbo.Drafts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Version = c.Int(nullable: false),
                        Name = c.String(maxLength: 50),
                        Template = c.String(maxLength: 50),
                        TemplateContent = c.String(),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.DraftResources",
                c => new
                    {
                        DraftId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        Title = c.String(maxLength: 50),
                        Keywords = c.String(maxLength: 500),
                        Description = c.String(maxLength: 500),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => new { t.DraftId, t.Language })
                .ForeignKey("dbo.Drafts", t => t.DraftId, cascadeDelete: true)
                .Index(t => t.DraftId);
            
            CreateTable(
                "dbo.DraftContentParts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        DraftId = c.Int(nullable: false),
                        PartType = c.String(maxLength: 50),
                        ContentType = c.String(maxLength: 50),
                        Ranking = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Drafts", t => t.DraftId, cascadeDelete: true)
                .Index(t => t.DraftId);
            
            CreateTable(
                "dbo.DraftContentPartResources",
                c => new
                    {
                        DraftContentPartId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        Content = c.String(),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => new { t.DraftContentPartId, t.Language })
                .ForeignKey("dbo.DraftContentParts", t => t.DraftContentPartId, cascadeDelete: true)
                .Index(t => t.DraftContentPartId);
            
        }
        
        public override void Down()
        {
            DropIndex("dbo.DraftContentPartResources", new[] { "DraftContentPartId" });
            DropIndex("dbo.DraftContentParts", new[] { "DraftId" });
            DropIndex("dbo.DraftResources", new[] { "DraftId" });
            DropIndex("dbo.DraftFiles", new[] { "DraftId" });
            DropIndex("dbo.DraftFileResources", new[] { "DbFileId" });
            DropIndex("dbo.DraftFileResources", new[] { "DraftFileId" });
            DropForeignKey("dbo.DraftContentPartResources", "DraftContentPartId", "dbo.DraftContentParts");
            DropForeignKey("dbo.DraftContentParts", "DraftId", "dbo.Drafts");
            DropForeignKey("dbo.DraftResources", "DraftId", "dbo.Drafts");
            DropForeignKey("dbo.DraftFiles", "DraftId", "dbo.Drafts");
            DropForeignKey("dbo.DraftFileResources", "DbFileId", "dbo.DbFiles");
            DropForeignKey("dbo.DraftFileResources", "DraftFileId", "dbo.DraftFiles");
            DropTable("dbo.DraftContentPartResources");
            DropTable("dbo.DraftContentParts");
            DropTable("dbo.DraftResources");
            DropTable("dbo.Drafts");
            DropTable("dbo.DraftFiles");
            DropTable("dbo.DraftFileResources");
        }
    }
}
