namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddTags : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.DbFileTags",
                c => new
                    {
                        FileId = c.Int(nullable: false),
                        TagId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.FileId, t.TagId })
                .ForeignKey("dbo.Tags", t => t.TagId, cascadeDelete: true)
                .ForeignKey("dbo.DbFiles", t => t.FileId, cascadeDelete: true)
                .Index(t => t.TagId)
                .Index(t => t.FileId);
            
            CreateTable(
                "dbo.Tags",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(maxLength: 50),
                    })
                .PrimaryKey(t => t.Id);
            
        }
        
        public override void Down()
        {
            DropIndex("dbo.DbFileTags", new[] { "FileId" });
            DropIndex("dbo.DbFileTags", new[] { "TagId" });
            DropForeignKey("dbo.DbFileTags", "FileId", "dbo.DbFiles");
            DropForeignKey("dbo.DbFileTags", "TagId", "dbo.Tags");
            DropTable("dbo.Tags");
            DropTable("dbo.DbFileTags");
        }
    }
}
