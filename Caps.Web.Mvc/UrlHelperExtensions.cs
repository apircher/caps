using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace Caps.Web.Mvc
{
    public static class UrlHelperExtensions
    {
        public static String LocalizeAction(this UrlHelper helper, String language)
        {
            return helper.LocalizeAction(helper.RequestContext.RouteData.Values["action"].ToString(), language);
        }

        public static String LocalizeAction(this UrlHelper helper, String actionName, String language)
        {
            var routeValues = helper.RequestContext.RouteData.Values;

            if (routeValues.ContainsKey("language"))
                routeValues["language"] = language;
            else
                routeValues.Add("language", language);

            return helper.Action(actionName, routeValues);

        }

        public static String Action(this UrlHelper helper, DbFileVersion fileVersion)
        {
            return helper.Action(fileVersion.File);
        }

        public static String Action(this UrlHelper helper, DbFile file)
        {
            return helper.Action("ContentFile", "CapsContent", new { area = "", id = file.Id, name = file.FileName });
        }
    }
}
