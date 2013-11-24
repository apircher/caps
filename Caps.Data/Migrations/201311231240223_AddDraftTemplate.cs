namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddDraftTemplate : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.DraftTemplates",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(maxLength: 50),
                        WebsiteId = c.Int(nullable: false),
                        Description = c.String(maxLength: 500),
                        TemplateContent = c.String(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Websites", t => t.WebsiteId, cascadeDelete: true)
                .Index(t => t.WebsiteId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.DraftTemplates", "WebsiteId", "dbo.Websites");
            DropIndex("dbo.DraftTemplates", new[] { "WebsiteId" });
            DropTable("dbo.DraftTemplates");
        }
    }
}
