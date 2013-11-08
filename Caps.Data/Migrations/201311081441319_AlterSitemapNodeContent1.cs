namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterSitemapNodeContent1 : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.SitemapNodeContents", "TemplateData", c => c.String());
            AlterColumn("dbo.SitemapNodeContents", "AuthorName", c => c.String(maxLength: 50));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.SitemapNodeContents", "AuthorName", c => c.String());
            DropColumn("dbo.SitemapNodeContents", "TemplateData");
        }
    }
}
