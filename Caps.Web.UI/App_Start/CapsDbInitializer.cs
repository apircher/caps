[assembly: WebActivator.PreApplicationStartMethod(typeof(Caps.Web.UI.App_Start.CapsDbInitializer), "InitializeDatabase")]

namespace Caps.Web.UI.App_Start
{
    using Caps.Data.Model;
    using Microsoft.AspNet.Identity;
    using Microsoft.AspNet.Identity.EntityFramework;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Web;

    public static class CapsDbInitializer
    {
        static void InitializeDatabase()
        {
            //Caps.Data.CapsDbContext.SetDbInitializer();

            try
            {
                using (var context = new Caps.Data.CapsDbContext())
                {
                    context.Database.CreateIfNotExists();
                    context.Database.Initialize(false);

                    SeedUsersAndRoles(context);
                }
            }
            catch (Exception ex)
            {
                throw new CapsDbInitializerException("Die Datenbank konnte nicht initialisiert werden.", ex);
            }
        }

        static void SeedUsersAndRoles(Caps.Data.CapsDbContext context)
        {
            var userStore = new UserStore<Author>(context);
            var roleStore = new RoleStore<IdentityRole>(context);
            var roleManager = new RoleManager<IdentityRole>(roleStore);

            EnsureDefaultRoles(roleManager);
            EnsureUserInRole(userStore, roleStore, "Administrator");

        }

        static void EnsureDefaultRoles(RoleManager<IdentityRole> roleManager)
        {
            EnsureRoleExists(roleManager, "Administrator");
        }

        static void EnsureUserInRole(UserStore<Author> userStore, RoleStore<IdentityRole> roleStore, String roleName, String defaultUserName = "admin", String defaultPassword = "caps234", String email = "admin@your-mail.server", String defaultFirstName = "Admin", String defaultLastName = "Istrator")
        {
            var db = userStore.Context as Caps.Data.CapsDbContext;

            var roleManager = new RoleManager<IdentityRole>(roleStore);
            EnsureRoleExists(roleManager, roleName);
            var role = roleManager.FindByName(roleName);

            if (!db.Users.Any(u => u.Roles.Any(r => r.RoleId == role.Id)))
            {
                var userManager = new UserManager<Author>(userStore);
                var user = userManager.FindByName(defaultUserName);
                if (user == null)
                {
                    var result = userManager.Create(new Author
                    {
                        UserName = defaultUserName,
                        Email = email,
                        FirstName = defaultFirstName,
                        LastName = defaultLastName
                    },
                    defaultPassword);

                    if (result.Succeeded)
                        user = userManager.FindByName(defaultUserName);
                }

                if (user != null)
                    userStore.AddToRoleAsync(user, roleName);
            }
        }

        static void EnsureRoleExists(RoleManager<IdentityRole> roleManager, params String[] roleNames)
        {
            foreach (var roleName in roleNames.Distinct())
            {
                if (!roleManager.RoleExists(roleName))
                    roleManager.Create(new IdentityRole(roleName));
            }
        }
    }

    [Serializable]
    public class CapsDbInitializerException : Exception
    {
        public CapsDbInitializerException()
            : base() 
        {
        }
        public CapsDbInitializerException(String message)
            : base(message) 
        {
        }
        public CapsDbInitializerException(String message, Exception innerException)
            : base(message, innerException) 
        {
        }
    }
}