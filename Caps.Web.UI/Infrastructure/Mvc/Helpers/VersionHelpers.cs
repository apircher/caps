using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Caps.Web.UI.Infrastructure.Mvc.Helpers
{
    public static class VersionHelpers
    {
        public static HtmlString CapsVersion(this HtmlHelper helper)
        {
            var assembly = typeof(VersionHelpers).Assembly;
            var version = assembly.GetName().Version;
            return new HtmlString(version.ToString());
        }
    }
}