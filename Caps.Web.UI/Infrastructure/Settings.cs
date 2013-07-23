using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    public static class Settings
    {
        public static int LockoutPeriod
        {
            get
            {
                int result;
                if (int.TryParse(ConfigurationManager.AppSettings["LockoutPeriod"], out result))
                    return result;
                return 15;
            }
        }
    }
}