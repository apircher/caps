namespace Caps.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AlterContentParts : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.PublicationTranslations",
                c => new
                    {
                        PublicationId = c.Int(nullable: false),
                        Language = c.String(nullable: false, maxLength: 10),
                        ContentVersion = c.Int(nullable: false),
                        ContentDate = c.DateTime(nullable: false),
                        AuthorName = c.String(maxLength: 50),
                    })
                .PrimaryKey(t => new { t.PublicationId, t.Language })
                .ForeignKey("dbo.Publications", t => t.PublicationId, cascadeDelete: true)
                .Index(t => t.PublicationId);

            RenameColumn("dbo.DraftContentParts", "PartType", "Name");
            //RenameColumn("dbo.Drafts", "Template", "TemplateName");
            //RenameColumn("dbo.Drafts", "TemplateContent", "Template");
            //RenameColumn("dbo.Publication", "TemplateData", "Template");
            RenameColumn("dbo.PublicationContentParts", "PartType", "Name");
            
            //AddColumn("dbo.DraftContentParts", "Name", c => c.String(maxLength: 50));
            AddColumn("dbo.DraftContentParts", "Properties", c => c.String());
            AddColumn("dbo.Drafts", "TemplateName", c => c.String(maxLength: 50));
            AddColumn("dbo.Drafts", "Properties", c => c.String());
            AddColumn("dbo.Publications", "Template", c => c.String());
            AddColumn("dbo.Publications", "Properties", c => c.String());
            //AddColumn("dbo.PublicationContentParts", "Name", c => c.String(maxLength: 50));
            AddColumn("dbo.PublicationContentParts", "Properties", c => c.String());
            AlterColumn("dbo.Drafts", "Name", c => c.String(nullable: false, maxLength: 50));
            AlterColumn("dbo.Drafts", "OriginalLanguage", c => c.String(nullable: false));
            AlterColumn("dbo.Drafts", "Template", c => c.String());


            //DropColumn("dbo.DraftContentParts", "PartType");            
            DropColumn("dbo.Drafts", "TemplateContent");
            DropColumn("dbo.Publications", "TemplateData");
            //DropColumn("dbo.PublicationContentParts", "PartType");
            DropColumn("dbo.PublicationContentPartResources", "TranslationAuthor");
            DropColumn("dbo.PublicationContentPartResources", "TranslationDate");
            DropColumn("dbo.PublicationContentPartResources", "Created_By");
            DropColumn("dbo.PublicationContentPartResources", "Created_At");
            DropColumn("dbo.PublicationContentPartResources", "Modified_By");
            DropColumn("dbo.PublicationContentPartResources", "Modified_At");
        }
        
        public override void Down()
        {
            AddColumn("dbo.PublicationContentPartResources", "Modified_At", c => c.DateTime(nullable: false));
            AddColumn("dbo.PublicationContentPartResources", "Modified_By", c => c.String(maxLength: 50));
            AddColumn("dbo.PublicationContentPartResources", "Created_At", c => c.DateTime(nullable: false));
            AddColumn("dbo.PublicationContentPartResources", "Created_By", c => c.String(maxLength: 50));
            AddColumn("dbo.PublicationContentPartResources", "TranslationDate", c => c.DateTime(nullable: false));
            AddColumn("dbo.PublicationContentPartResources", "TranslationAuthor", c => c.String());
            AddColumn("dbo.PublicationContentParts", "PartType", c => c.String(maxLength: 50));
            AddColumn("dbo.Publications", "TemplateData", c => c.String());
            AddColumn("dbo.Drafts", "TemplateContent", c => c.String());
            AddColumn("dbo.DraftContentParts", "PartType", c => c.String(maxLength: 50));
            DropForeignKey("dbo.PublicationTranslations", "PublicationId", "dbo.Publications");
            DropIndex("dbo.PublicationTranslations", new[] { "PublicationId" });
            AlterColumn("dbo.Drafts", "Template", c => c.String(maxLength: 50));
            AlterColumn("dbo.Drafts", "OriginalLanguage", c => c.String());
            AlterColumn("dbo.Drafts", "Name", c => c.String(maxLength: 50));
            DropColumn("dbo.PublicationContentParts", "Properties");
            DropColumn("dbo.PublicationContentParts", "Name");
            DropColumn("dbo.Publications", "Properties");
            DropColumn("dbo.Publications", "Template");
            DropColumn("dbo.Drafts", "Properties");
            DropColumn("dbo.Drafts", "TemplateName");
            DropColumn("dbo.DraftContentParts", "Properties");
            DropColumn("dbo.DraftContentParts", "Name");
            DropTable("dbo.PublicationTranslations");
        }
    }
}
