namespace Caps.Data.Migrations
{
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
            //AutomaticMigrationsEnabled = true;
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

            WebSecurity.InitializeDatabaseConnection("CapsDbContext", "Author", "Id", "UserName", true);

            if (!Roles.RoleExists("Administrator")) Roles.CreateRole("Administrator");
            WebSecurity.CreateUserAndAccount("admin", "caps234", new { Email = "admin@your-company.xx" });
            Roles.AddUserToRole("admin", "Administrator");
        }
    }
}
