namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddAuthorPropertiesMissingInIdentity : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.AspNetUsers", "CreationDate", c => c.DateTime());
            AddColumn("dbo.AspNetUsers", "LastPasswordChangedDate", c => c.DateTime());
            AddColumn("dbo.AspNetUsers", "LastLockoutDate", c => c.DateTime());
        }
        
        public override void Down()
        {
            DropColumn("dbo.AspNetUsers", "LastLockoutDate");
            DropColumn("dbo.AspNetUsers", "LastPasswordChangedDate");
            DropColumn("dbo.AspNetUsers", "CreationDate");
        }
    }
}
