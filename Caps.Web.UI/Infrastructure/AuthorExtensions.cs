using Caps.Data;
using Caps.Data.Model;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;

namespace Caps.Web.UI.Infrastructure
{
    public static class AuthorExtensions
    {
        public static bool IsLastUserInRole(this Author author, String roleName)
        {
            var userRoles = Roles.GetRolesForUser(author.UserName);
            var users = Roles.GetUsersInRole(roleName);
            return userRoles.Contains(roleName, StringComparer.OrdinalIgnoreCase) &&
                users.Where(u => !String.Equals(u, author.UserName)).Count() == 0;
        }

        public static String[] GetRoles(this Author author)
        {
            return Roles.GetRolesForUser(author.UserName);
        }

        /// <summary>
        /// Returns true if the Author is currently locked out and false otherwhise.
        /// </summary>
        /// <param name="author">The Author in question.</param>
        /// <returns></returns>
        public static bool IsLockedOut(this Author author)
        {
            if (author.PasswordFailuresSinceLastSuccess < Settings.MaxInvalidLoginAttempts)
                return false;

            var lockedUntil = author.LastPasswordFailureDate.GetValueOrDefault(DateTime.MinValue)
                .AddMinutes(Settings.LockoutPeriod);

            return lockedUntil >= DateTime.UtcNow;
        }

        public static void RegisterActivity(this Author author)
        {
            author.LastActivityDate = DateTime.UtcNow;
        }
        public static void RegisterLogin(this Author author)
        {
            author.LastLoginDate = DateTime.UtcNow;
        }

        public static void DeleteAuthorAndAccount(this Author author, CapsDbContext db)
        {
            // Delete the account.
            var store = new UserStore<Author>(db);
            var userManager = new UserManager<Author>(store);
            // Remove all Roles.
            Array.ForEach(userManager.GetRoles(author.Id).ToArray(), r => userManager.RemoveFromRole(author.Id, r));
            // Delete the Author
            db.Users.Remove(author);
        }
    }
}