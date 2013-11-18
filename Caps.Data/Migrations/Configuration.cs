namespace Caps.Data.Migrations
{
    using Caps.Data.Utils;
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;
    using System.Web.Security;
    using WebMatrix.WebData;

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

            //  You can use the DbSet<T>.AddOrUpdate() helper extension method 
            //  to avoid creating duplicate seed data. E.g.
            //
            //    context.People.AddOrUpdate(
            //      p => p.FullName,
            //      new Person { FullName = "Andrew Peters" },
            //      new Person { FullName = "Brice Lambson" },
            //      new Person { FullName = "Rowan Miller" }
            //    );
            //

            context.Websites.AddOrUpdate(
                new Caps.Data.Model.Website { Name = "Caps Website", Url = "http://caps.luxbox.net" }
            );

            SqlTableChangeTracking.InitializeChangeTracking(context);

#if DEBUG
            //WebSecurity.InitializeDatabaseConnection("CapsDbContext", "Author", "Id", "UserName", true);
#endif
        }
    }
}
