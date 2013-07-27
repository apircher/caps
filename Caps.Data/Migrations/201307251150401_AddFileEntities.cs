namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddFileEntities : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.DbFiles",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        FileName = c.String(maxLength: 50),
                        ContentType = c.String(maxLength: 50),
                        Copyright = c.String(maxLength: 200),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.DbFileVersions",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        FileId = c.Int(nullable: false),
                        FileSize = c.Int(nullable: false),
                        Hash = c.Binary(maxLength: 20),
                        Notes = c.String(),
                        Created_By = c.String(maxLength: 50),
                        Created_At = c.DateTime(nullable: false),
                        Modified_By = c.String(maxLength: 50),
                        Modified_At = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.DbFiles", t => t.FileId, cascadeDelete: true)
                .Index(t => t.FileId);
            
            CreateTable(
                "dbo.DbFileContents",
                c => new
                    {
                        FileVersionId = c.Int(nullable: false),
                        Data = c.Binary(),
                    })
                .PrimaryKey(t => t.FileVersionId)
                .ForeignKey("dbo.DbFileVersions", t => t.FileVersionId)
                .Index(t => t.FileVersionId);
            
            CreateTable(
                "dbo.DbThumbnails",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        FileVersionId = c.Int(nullable: false),
                        OriginalFileHash = c.Binary(maxLength: 20),
                        ContentType = c.String(maxLength: 50),
                        Name = c.String(maxLength: 50),
                        Width = c.Int(nullable: false),
                        Height = c.Int(nullable: false),
                        Data = c.Binary(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.DbFileVersions", t => t.FileVersionId, cascadeDelete: true)
                .Index(t => t.FileVersionId);
            
        }
        
        public override void Down()
        {
            DropIndex("dbo.DbThumbnails", new[] { "FileVersionId" });
            DropIndex("dbo.DbFileContents", new[] { "FileVersionId" });
            DropIndex("dbo.DbFileVersions", new[] { "FileId" });
            DropForeignKey("dbo.DbThumbnails", "FileVersionId", "dbo.DbFileVersions");
            DropForeignKey("dbo.DbFileContents", "FileVersionId", "dbo.DbFileVersions");
            DropForeignKey("dbo.DbFileVersions", "FileId", "dbo.DbFiles");
            DropTable("dbo.DbThumbnails");
            DropTable("dbo.DbFileContents");
            DropTable("dbo.DbFileVersions");
            DropTable("dbo.DbFiles");
        }
    }
}
