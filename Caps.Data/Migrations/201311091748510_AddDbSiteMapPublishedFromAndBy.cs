namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddDbSiteMapPublishedFromAndBy : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.DbSiteMaps", "PublishedFrom", c => c.DateTime());
            AddColumn("dbo.DbSiteMaps", "PublishedBy", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.DbSiteMaps", "PublishedBy");
            DropColumn("dbo.DbSiteMaps", "PublishedFrom");
        }
    }
}
