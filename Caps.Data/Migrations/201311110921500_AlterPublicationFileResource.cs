namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterPublicationFileResource : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.PublicationFileResources", "DbFileId", "dbo.DbFiles");
            DropIndex("dbo.PublicationFileResources", new[] { "DbFileId" });
            AddColumn("dbo.PublicationFileResources", "DbFileVersionId", c => c.Int());
            CreateIndex("dbo.PublicationFileResources", "DbFileVersionId");
            AddForeignKey("dbo.PublicationFileResources", "DbFileVersionId", "dbo.DbFileVersions", "Id");
            DropColumn("dbo.PublicationFileResources", "DbFileId");
        }
        
        public override void Down()
        {
            AddColumn("dbo.PublicationFileResources", "DbFileId", c => c.Int());
            DropForeignKey("dbo.PublicationFileResources", "DbFileVersionId", "dbo.DbFileVersions");
            DropIndex("dbo.PublicationFileResources", new[] { "DbFileVersionId" });
            DropColumn("dbo.PublicationFileResources", "DbFileVersionId");
            CreateIndex("dbo.PublicationFileResources", "DbFileId");
            AddForeignKey("dbo.PublicationFileResources", "DbFileId", "dbo.DbFiles", "Id");
        }
    }
}
