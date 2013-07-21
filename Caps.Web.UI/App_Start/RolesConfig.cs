using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;

namespace Caps.Web.UI.App_Start
{
    public class RolesConfig
    {
        public static void EnsureDefaultRoles()
        {
            EnsureRoleExists("Administrator");
        }

        public static void EnsureRoleExists(params String[] roleNames)
        {
            foreach (var roleName in roleNames.Distinct())
                if (!Roles.RoleExists(roleName)) Roles.CreateRole(roleName);
        }

        public static void EnsureUserInRole(String roleName, String defaultUserName = "admin", String defaultPassword = "caps234", String email = "admin@your-mail.server")
        {
            EnsureRoleExists(roleName);

            if (!Roles.GetUsersInRole(roleName).Any())
            {
                var user = Membership.CreateUser(defaultUserName, defaultPassword);
                Roles.AddUserToRole(user.UserName, roleName);

                user.Email = email;
                Membership.UpdateUser(user);
            }
        }
    }
}