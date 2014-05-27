using Caps.Data;
using Caps.Data.Model;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    public class ApplicationUserManager : UserManager<Author>
    {
        CapsDbContext db;

        public ApplicationUserManager(IUserStore<Author> store, CapsDbContext db) : base(store)
        {
            this.db = db;
        }
        
        public static ApplicationUserManager Create(IdentityFactoryOptions<ApplicationUserManager> options, IOwinContext context)
        {
            var db = context.Get<CapsDbContext>();
            var manager = new ApplicationUserManager(new UserStore<Author>(db), db);

            // Configure validation logic for usernames
            manager.UserValidator = new UserValidator<Author>(manager)
            {
                AllowOnlyAlphanumericUserNames = false,
                RequireUniqueEmail = true
            };

            // Configure validation logic for passwords
            manager.PasswordValidator = new PasswordValidator
            {
                RequiredLength = 6,
                RequireNonLetterOrDigit = true,
                RequireDigit = false,
                RequireLowercase = false,
                RequireUppercase = false,
            };

            // Configure user lockout defaults
            manager.UserLockoutEnabledByDefault = true;
            manager.DefaultAccountLockoutTimeSpan = TimeSpan.FromMinutes(5);
            manager.MaxFailedAccessAttemptsBeforeLockout = 5;

            var dataProtectionProvider = options.DataProtectionProvider;
            if (dataProtectionProvider != null)
                manager.UserTokenProvider = new DataProtectorTokenProvider<Author>(dataProtectionProvider.Create("ASP.NET Identity"));

            return manager;
        }

        public bool IsLastUserInRole(String userName, String roleName)
        {
            var roleId = db.Roles.Where(r => r.Name.ToLower() == roleName.ToLower()).Select(r => r.Id).FirstOrDefault();
            var usersInRole = db.Users.Where(u => u.Roles.Any(r => r.RoleId == roleId));
            return !usersInRole.Any(u => !String.Equals(u.UserName, userName));
        }
    }
}