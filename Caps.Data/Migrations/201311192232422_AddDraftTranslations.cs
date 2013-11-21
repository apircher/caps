namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddDraftTranslations : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.DraftResources", "DraftId", "dbo.Drafts");
            DropIndex("dbo.DraftResources", new[] { "DraftId" });
            CreateTable(
                "dbo.DraftTranslations",
                c => new
                    {
                        DraftId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        Version = c.Int(nullable: false),
                        TranslatedName = c.String(maxLength: 50),
                        Status = c.String(maxLength: 20),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => new { t.DraftId, t.Language })
                .ForeignKey("dbo.Drafts", t => t.DraftId, cascadeDelete: true)
                .Index(t => t.DraftId);
            
            DropColumn("dbo.DraftContentPartResources", "Created_By");
            DropColumn("dbo.DraftContentPartResources", "Created_At");
            DropColumn("dbo.DraftContentPartResources", "Modified_By");
            DropColumn("dbo.DraftContentPartResources", "Modified_At");
            DropTable("dbo.DraftResources");
        }
        
        public override void Down()
        {
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
                .PrimaryKey(t => new { t.DraftId, t.Language });
            
            AddColumn("dbo.DraftContentPartResources", "Modified_At", c => c.DateTime(nullable: false));
            AddColumn("dbo.DraftContentPartResources", "Modified_By", c => c.String(maxLength: 50));
            AddColumn("dbo.DraftContentPartResources", "Created_At", c => c.DateTime(nullable: false));
            AddColumn("dbo.DraftContentPartResources", "Created_By", c => c.String(maxLength: 50));
            DropForeignKey("dbo.DraftTranslations", "DraftId", "dbo.Drafts");
            DropIndex("dbo.DraftTranslations", new[] { "DraftId" });
            DropTable("dbo.DraftTranslations");
            CreateIndex("dbo.DraftResources", "DraftId");
            AddForeignKey("dbo.DraftResources", "DraftId", "dbo.Drafts", "Id", cascadeDelete: true);
        }
    }
}
