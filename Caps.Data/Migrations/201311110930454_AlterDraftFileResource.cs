namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterDraftFileResource : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.DraftFileResources", "DbFileId", "dbo.DbFiles");
            DropIndex("dbo.DraftFileResources", new[] { "DbFileId" });
            AddColumn("dbo.DraftFileResources", "DbFileVersionId", c => c.Int());
            CreateIndex("dbo.DraftFileResources", "DbFileVersionId");
            AddForeignKey("dbo.DraftFileResources", "DbFileVersionId", "dbo.DbFileVersions", "Id");
            DropColumn("dbo.DraftFileResources", "DbFileId");
        }
        
        public override void Down()
        {
            AddColumn("dbo.DraftFileResources", "DbFileId", c => c.Int());
            DropForeignKey("dbo.DraftFileResources", "DbFileVersionId", "dbo.DbFileVersions");
            DropIndex("dbo.DraftFileResources", new[] { "DbFileVersionId" });
            DropColumn("dbo.DraftFileResources", "DbFileVersionId");
            CreateIndex("dbo.DraftFileResources", "DbFileId");
            AddForeignKey("dbo.DraftFileResources", "DbFileId", "dbo.DbFiles", "Id");
        }
    }
}
