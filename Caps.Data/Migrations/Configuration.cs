namespace Caps.Data.Migrations
{
    using Caps.Data.Utils;
    using Microsoft.AspNet.Identity;
    using Microsoft.AspNet.Identity.EntityFramework;
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

            AddUsersAndRoles(context);
        }

        bool AddUsersAndRoles(Caps.Data.CapsDbContext context)
        {
            if (!RoleExists("Administrator", context))
            {
                if (!CreateRole("Administrator", context))
                    return false;

                var initialUser = new Caps.Data.Model.Author
                {
                    UserName = "admin",
                    FirstName = "Vorname",
                    LastName = "NachName",
                    Email = "admin@xyz.de",
                    CreationDate = DateTime.UtcNow
                };

                UserManager<Caps.Data.Model.Author> userManager = new UserManager<Caps.Data.Model.Author>(new UserStore<Caps.Data.Model.Author>(context));
                var r = userManager.Create(initialUser, "caps234");
                if (!r.Succeeded) return false;

                userManager.AddToRole(initialUser.Id, "Administrator");
            }

            return true;
        }

        bool RoleExists(String name, Caps.Data.CapsDbContext context)
        {
            var roleManager = new RoleManager<IdentityRole>(new RoleStore<IdentityRole>(context));
            return roleManager.FindByName(name) != null;
        }

        bool CreateRole(String name, Caps.Data.CapsDbContext context)
        {
            var roleManager = new RoleManager<IdentityRole>(new RoleStore<IdentityRole>(context));
            var r = roleManager.Create(new IdentityRole(name));
            return r.Succeeded;
        }
    }
}
