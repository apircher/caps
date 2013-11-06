namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterSitemapNodes : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.SitemapNodes", "ContentId", "dbo.SitemapNodeContents");
            DropIndex("dbo.SitemapNodes", new[] { "ContentId" });
            AlterColumn("dbo.SitemapNodes", "ContentId", c => c.Int());
            CreateIndex("dbo.SitemapNodes", "ContentId");
            AddForeignKey("dbo.SitemapNodes", "ContentId", "dbo.SitemapNodeContents", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.SitemapNodes", "ContentId", "dbo.SitemapNodeContents");
            DropIndex("dbo.SitemapNodes", new[] { "ContentId" });
            AlterColumn("dbo.SitemapNodes", "ContentId", c => c.Int(nullable: false));
            CreateIndex("dbo.SitemapNodes", "ContentId");
            AddForeignKey("dbo.SitemapNodes", "ContentId", "dbo.SitemapNodeContents", "Id", cascadeDelete: true);
        }
    }
}
