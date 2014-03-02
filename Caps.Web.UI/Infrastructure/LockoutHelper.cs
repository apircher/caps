using Caps.Data.Model;
using Microsoft.AspNet.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    public static class LockoutHelper
    {
        public static bool IsUserLockedOut(this UserManager<Author> userManager, String userName)
        {
            return userManager.IsUserLockedOut(userManager.FindByName(userName));
        }

        public static bool IsUserLockedOut(this UserManager<Author> userManager, Author user)
        {
            return user != null ? user.IsLockedOut() : false;
        }
    }
}