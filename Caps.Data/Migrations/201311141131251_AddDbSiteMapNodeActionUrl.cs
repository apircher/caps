namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddDbSiteMapNodeActionUrl : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.DbSiteMapNodes", "ActionUrl", c => c.String(maxLength: 250));
        }
        
        public override void Down()
        {
            DropColumn("dbo.DbSiteMapNodes", "ActionUrl");
        }
    }
}
