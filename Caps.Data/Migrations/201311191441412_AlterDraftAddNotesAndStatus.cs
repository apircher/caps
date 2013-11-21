namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterDraftAddNotesAndStatus : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Drafts", "Notes", c => c.String());
            AddColumn("dbo.Drafts", "Status", c => c.String(maxLength: 20));
        }
        
        public override void Down()
        {
            DropColumn("dbo.Drafts", "Status");
            DropColumn("dbo.Drafts", "Notes");
        }
    }
}
