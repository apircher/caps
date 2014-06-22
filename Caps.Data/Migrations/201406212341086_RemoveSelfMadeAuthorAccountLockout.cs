namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RemoveSelfMadeAuthorAccountLockout : DbMigration
    {
        public override void Up()
        {
            DropColumn("dbo.AspNetUsers", "LastLockoutDate");
            DropColumn("dbo.AspNetUsers", "LastPasswordFailureDate");
            DropColumn("dbo.AspNetUsers", "PasswordFailuresSinceLastSuccess");
        }
        
        public override void Down()
        {
            AddColumn("dbo.AspNetUsers", "PasswordFailuresSinceLastSuccess", c => c.Int(nullable: false));
            AddColumn("dbo.AspNetUsers", "LastPasswordFailureDate", c => c.DateTime());
            AddColumn("dbo.AspNetUsers", "LastLockoutDate", c => c.DateTime());
        }
    }
}
