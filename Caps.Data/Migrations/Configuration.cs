namespace Caps.Data.Migrations
{
    using Caps.Data.Utils;
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;
    using System.Web.Security;

    internal sealed class Configuration : DbMigrationsConfiguration<Caps.Data.CapsDbContext>
    {
        public Configuration()
        {
//#if DEBUG
//            AutomaticMigrationsEnabled = true;
//            AutomaticMigrationDataLossAllowed = true;
//#else
//            AutomaticMigrationsEnabled = false;
//#endif
        }

        protected override void Seed(Caps.Data.CapsDbContext context)
        {
            //  This method will be called after migrating to the latest version.

            context.Websites.AddOrUpdate(
                new Caps.Data.Model.Website { Name = "Caps Website", Url = "http://caps.luxbox.net" }
            );

            foreach (var draft in context.Drafts)
            {
                if (String.IsNullOrWhiteSpace(draft.OriginalLanguage)) draft.OriginalLanguage = "de";
                if (String.IsNullOrWhiteSpace(draft.Status)) draft.Status = "NEW";
            }

            SqlTableChangeTracking.InitializeChangeTracking(context);
        }
    }
}
