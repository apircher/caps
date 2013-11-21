namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterDraftAddOriginalLanguage : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Drafts", "OriginalLanguage", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.Drafts", "OriginalLanguage");
        }
    }
}
