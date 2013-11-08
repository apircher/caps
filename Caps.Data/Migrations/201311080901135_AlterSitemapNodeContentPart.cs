namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterSitemapNodeContentPart : DbMigration
    {
        public override void Up()
        {
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
                .PrimaryKey(t => new { t.SitemapNodeContentPartId, t.Language })
                .ForeignKey("dbo.SitemapNodeContentParts", t => t.SitemapNodeContentPartId, cascadeDelete: true)
                .Index(t => t.SitemapNodeContentPartId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.SitemapNodeContentPartResources", "SitemapNodeContentPartId", "dbo.SitemapNodeContentParts");
            DropIndex("dbo.SitemapNodeContentPartResources", new[] { "SitemapNodeContentPartId" });
            DropTable("dbo.SitemapNodeContentPartResources");
        }
    }
}
