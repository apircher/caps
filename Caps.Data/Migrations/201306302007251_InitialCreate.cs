namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class InitialCreate : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Websites",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Sitemaps",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        WebsiteId = c.Int(nullable: false),
                        Version = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Websites", t => t.WebsiteId, cascadeDelete: true)
                .Index(t => t.WebsiteId);
            
        }
        
        public override void Down()
        {
            DropIndex("dbo.Sitemaps", new[] { "WebsiteId" });
            DropForeignKey("dbo.Sitemaps", "WebsiteId", "dbo.Websites");
            DropTable("dbo.Sitemaps");
            DropTable("dbo.Websites");
        }
    }
}
