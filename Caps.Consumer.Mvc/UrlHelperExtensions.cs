using Caps.Consumer.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;
using Caps.Consumer.Localization;
using Caps.Consumer.Mvc.Utils;

namespace Caps.Consumer.Mvc
{
    public static class UrlHelperExtensions
    {
        public static String LocalizeAction(this UrlHelper helper, String language)
        {
            return helper.LocalizeAction(helper.RequestContext.RouteData.Values["action"].ToString(), language);
        }

        public static String LocalizeAction(this UrlHelper helper, String actionName, String language)
        {
            return helper.Action(actionName, GetRouteValues(helper, language));
        }

        public static String LocalizeAction(this UrlHelper helper, String actionName, String controllerName, String language)
        {
            return helper.Action(actionName, controllerName, new { language = language });
        }

        static System.Web.Routing.RouteValueDictionary GetRouteValues(UrlHelper helper, String language)
        {
            var routeValues = helper.RequestContext.RouteData.Values;

            if (routeValues.ContainsKey("language"))
                routeValues["language"] = language;
            else
                routeValues.Add("language", language);

            if (routeValues.ContainsKey("name"))
            {
                var provider = System.Web.SiteMap.Provider as Caps.Consumer.Mvc.Providers.CapsSiteMapProvider;
                if (provider != null)
                {
                    var node = provider.CurrentNode as Caps.Consumer.Mvc.SiteMap.CapsSiteMapNode;
                    if (node != null)
                        routeValues["name"] = node.Entity.GetValueForLanguage(language, r => r.Title, String.Empty, Language.DefaultLanguage).UrlEncode();
                }
            }

            return routeValues;
        }

        public static String Action(this UrlHelper helper, DbFileVersion fileVersion)
        {
            return helper.Action(fileVersion.File);
        }

        public static String Action(this UrlHelper helper, DbFile file)
        {
            return helper.Action("ContentFile", "Caps", new { area = "", id = file.Id, name = file.FileName });
        }

        public static String ToAbsolute(this UrlHelper helper, String url)
        {
            var s = System.Web.VirtualPathUtility.ToAbsolute(url);
            var requestUri = helper.RequestContext.HttpContext.Request.Url;
            return String.Format("{0}://{1}{2}/{3}", requestUri.Scheme, requestUri.Host, requestUri.Port == 80 ? String.Empty : ":" + requestUri.Port, s.TrimStart('/'));
        }
    }
}
