namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddDbSiteMapNodePictureFileVersion : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.DbSiteMapNodeResources", "PictureFileVersionId", c => c.Int());
            CreateIndex("dbo.DbSiteMapNodeResources", "PictureFileVersionId");
            AddForeignKey("dbo.DbSiteMapNodeResources", "PictureFileVersionId", "dbo.DbFileVersions", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.DbSiteMapNodeResources", "PictureFileVersionId", "dbo.DbFileVersions");
            DropIndex("dbo.DbSiteMapNodeResources", new[] { "PictureFileVersionId" });
            DropColumn("dbo.DbSiteMapNodeResources", "PictureFileVersionId");
        }
    }
}
