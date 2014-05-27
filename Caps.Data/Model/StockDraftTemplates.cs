using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data.Entity.Migrations;

namespace Caps.Data.Model
{
    public static class StockDraftTemplates
    {
        public static void Seed(Caps.Data.CapsDbContext context, Website defaultWebsite)
        {
            if (!context.DraftTemplates.Any() && defaultWebsite != null)
            {
                context.DraftTemplates.AddOrUpdate(new DraftTemplate
                {
                    Name = "Template 1",
                    TemplateContent = stockTemplate1,
                    Description = "Eine Vorlage mit Kopfbereich, Hauptteil, Zusatzinformationen und Fußleiste.",
                    WebsiteId = defaultWebsite.Id
                });

                context.DraftTemplates.AddOrUpdate(new DraftTemplate
                {
                    Name = "Template 2",
                    TemplateContent = stockTemplate2,
                    Description = "Eine Vorlage mit Kopfbereich, Hauptteil und Zusatzinformationen.",
                    WebsiteId = defaultWebsite.Id
                });

                context.DraftTemplates.AddOrUpdate(new DraftTemplate
                {
                    Name = "Template 3",
                    TemplateContent = stockTemplate3,
                    Description = "Eine Vorlage mit Kopfbereich und Hauptteil.",
                    WebsiteId = defaultWebsite.Id
                });
            }
        }

        const string stockTemplate1 = @"
{
    ""name"": ""Template 1"",
    ""rows"": [
        {
            ""cells"": [
                {
                    ""name"": ""Header"",
                    ""title"": ""Kopfbereich"",
                    ""colspan"": 12,
                    ""contentType"": ""markdown""
                }
            ]
        },
        {
            ""cells"": [
                {
                    ""name"": ""Main"",
                    ""title"": ""Hauptteil"",
                    ""colspan"": 8,
                    ""contentType"": ""markdown""
                },
                {
                    ""name"": ""Sidebar"",
                    ""title"": ""Zusatzinformationen"",
                    ""colspan"": 4,
                    ""contentType"": ""markdown""
                }
            ]
        },
        {
            ""cells"": [
                {
                    ""name"": ""Footer"",
                    ""title"": ""Fußbereich"",
                    ""colspan"": 12,
                    ""contentType"": ""markdown""
                }
            ]
        }
    ]
}
";
        const string stockTemplate2 = @"
{
    ""name"": ""Template 2"",
    ""rows"": [
        {
            ""cells"": [
                {
                    ""name"": ""Header"",
                    ""title"": ""Kopfbereich"",
                    ""colspan"": 12,
                    ""contentType"": ""markdown""
                }
            ]
        },
        {
            ""cells"": [
                {
                    ""name"": ""Main"",
                    ""title"": ""Hauptteil"",
                    ""colspan"": 12,
                    ""contentType"": ""markdown""
                }
            ]
        },
        {
            ""cells"": [
                {
                    ""name"": ""Footer"",
                    ""title"": ""Fußbereich"",
                    ""colspan"": 12,
                    ""contentType"": ""markdown""
                }
            ]
        }
    ]
}
";
        const string stockTemplate3 = @"
{
    ""name"": ""Template 3"",
    ""rows"": [
        {
            ""cells"": [
                {
                    ""name"": ""Header"",
                    ""title"": ""Kopfbereich"",
                    ""colspan"": 12,
                    ""contentType"": ""markdown""
                }
            ]
        },
        {
            ""cells"": [
                {
                    ""name"": ""Main"",
                    ""title"": ""Hauptteil"",
                    ""colspan"": 12,
                    ""contentType"": ""markdown""
                }
            ]
        }
    ]
}
";
    }
}
