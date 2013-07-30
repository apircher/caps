namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddFileProperties : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.DbFileProperties",
                c => new
                    {
                        FileVersionId = c.Int(nullable: false),
                        PropertyName = c.String(nullable: false, maxLength: 128),
                        PropertyValue = c.String(maxLength: 250),
                    })
                .PrimaryKey(t => new { t.FileVersionId, t.PropertyName })
                .ForeignKey("dbo.DbFileVersions", t => t.FileVersionId, cascadeDelete: true)
                .Index(t => t.FileVersionId);
            
            DropColumn("dbo.DbFiles", "Copyright");
        }
        
        public override void Down()
        {
            AddColumn("dbo.DbFiles", "Copyright", c => c.String(maxLength: 200));
            DropIndex("dbo.DbFileProperties", new[] { "FileVersionId" });
            DropForeignKey("dbo.DbFileProperties", "FileVersionId", "dbo.DbFileVersions");
            DropTable("dbo.DbFileProperties");
        }
    }
}
