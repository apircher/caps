namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterDraftFileResources : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.DraftFileResources", "DbFileId", "dbo.DbFiles");
            DropIndex("dbo.DraftFileResources", new[] { "DbFileId" });
            AlterColumn("dbo.DraftFileResources", "DbFileId", c => c.Int());
            CreateIndex("dbo.DraftFileResources", "DbFileId");
            AddForeignKey("dbo.DraftFileResources", "DbFileId", "dbo.DbFiles", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.DraftFileResources", "DbFileId", "dbo.DbFiles");
            DropIndex("dbo.DraftFileResources", new[] { "DbFileId" });
            AlterColumn("dbo.DraftFileResources", "DbFileId", c => c.Int(nullable: false));
            CreateIndex("dbo.DraftFileResources", "DbFileId");
            AddForeignKey("dbo.DraftFileResources", "DbFileId", "dbo.DbFiles", "Id", cascadeDelete: true);
        }
    }
}
