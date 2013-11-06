namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterWebsites : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.Websites", "Name", c => c.String(maxLength: 50));
            AlterColumn("dbo.Websites", "Url", c => c.String(maxLength: 250));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.Websites", "Url", c => c.String());
            AlterColumn("dbo.Websites", "Name", c => c.String());
        }
    }
}
