using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;

namespace Caps.Web.UI.Infrastructure
{
    public static class MembershipExtensions
    {
        public static bool IsLastUserInRole(this MembershipUser user, String roleName)
        {
            var userRoles = Roles.GetRolesForUser(user.UserName);
            var users = Roles.GetUsersInRole(roleName);
            return userRoles.Contains(roleName, StringComparer.OrdinalIgnoreCase) &&
                users.Where(u => !String.Equals(u, user.UserName)).Count() == 0;
        }
    }
}