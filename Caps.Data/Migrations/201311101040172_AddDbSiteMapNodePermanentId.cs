namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddDbSiteMapNodePermanentId : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.DbSiteMapNodes", "PermanentId", c => c.Int(nullable: false));
            AddColumn("dbo.DbSiteMapNodes", "Name", c => c.String(maxLength: 50));
            DropColumn("dbo.DbSiteMapNodes", "ExternalName");
        }
        
        public override void Down()
        {
            AddColumn("dbo.DbSiteMapNodes", "ExternalName", c => c.String(maxLength: 50));
            DropColumn("dbo.DbSiteMapNodes", "Name");
            DropColumn("dbo.DbSiteMapNodes", "PermanentId");
        }
    }
}
