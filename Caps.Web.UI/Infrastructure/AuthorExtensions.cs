using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using WebMatrix.WebData;

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
        /// <param name="lockoutPeriod">The Lockout-Period in Minutes.</param>
        /// <returns></returns>
        public static bool IsLockedOut(this Author author, int lockoutPeriod)
        {
            return WebSecurity.IsAccountLockedOut(author.UserName, 5, TimeSpan.FromMinutes(lockoutPeriod));
        }

        /// <summary>
        /// Returns true if the Author is currently locked out and false otherwhise.
        /// </summary>
        /// <param name="author">The Author in question.</param>
        /// <returns></returns>
        public static bool IsLockedOut(this Author author)
        {
            return author.IsLockedOut(Settings.LockoutPeriod);
        }

        public static void RegisterActivity(this Author author)
        {
            author.LastActivityDate = DateTime.UtcNow;
        }
        public static void RegisterLogin(this Author author)
        {
            author.LastLoginDate = DateTime.UtcNow;
        }
    }
}