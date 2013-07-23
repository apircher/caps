using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.WebData;

namespace Caps.Web.UI.Infrastructure
{
    public static class LockoutHelper
    {
        public static bool IsAuthorLockedOut(String userName)
        {
            return WebSecurity.IsAccountLockedOut(userName, 5, TimeSpan.FromMinutes(Settings.LockoutPeriod));
        }
    }
}