namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class Extend_Authors : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Author", "Phone", c => c.String(maxLength: 50));
            AlterColumn("dbo.Author", "UserName", c => c.String(nullable: false, maxLength: 20));
            AlterColumn("dbo.Author", "FirstName", c => c.String(nullable: false, maxLength: 50));
            AlterColumn("dbo.Author", "LastName", c => c.String(nullable: false, maxLength: 50));
            AlterColumn("dbo.Author", "Email", c => c.String(nullable: false, maxLength: 50));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.Author", "Email", c => c.String());
            AlterColumn("dbo.Author", "LastName", c => c.String());
            AlterColumn("dbo.Author", "FirstName", c => c.String());
            AlterColumn("dbo.Author", "UserName", c => c.String());
            DropColumn("dbo.Author", "Phone");
        }
    }
}
