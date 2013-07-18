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
    }
}