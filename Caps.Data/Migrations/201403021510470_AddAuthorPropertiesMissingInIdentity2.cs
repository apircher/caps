namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddAuthorPropertiesMissingInIdentity2 : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.AspNetUsers", "LastPasswordFailureDate", c => c.DateTime());
            AddColumn("dbo.AspNetUsers", "PasswordFailuresSinceLastSuccess", c => c.Int());
        }
        
        public override void Down()
        {
            DropColumn("dbo.AspNetUsers", "PasswordFailuresSinceLastSuccess");
            DropColumn("dbo.AspNetUsers", "LastPasswordFailureDate");
        }
    }
}
