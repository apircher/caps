namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterSitemapNodeContent : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.SitemapNodeContents", "EntityType", c => c.String(maxLength: 50));
            AlterColumn("dbo.SitemapNodeContents", "ContentDate", c => c.DateTime(nullable: false));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.SitemapNodeContents", "ContentDate", c => c.String());
            DropColumn("dbo.SitemapNodeContents", "EntityType");
        }
    }
}
