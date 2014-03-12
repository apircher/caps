using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace Caps.Consumer.Mvc.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
    public sealed class SetCultureAttribute : FilterAttribute, IActionFilter
    {
        const String DefaultCulture = "de-DE";

        public void OnActionExecuting(ActionExecutingContext filterContext)
        {
            String cultureCode = GetUserCulture(filterContext);
            if (!String.IsNullOrEmpty(cultureCode))
                SetUserCulture(filterContext.HttpContext, cultureCode);
        }

        public void OnActionExecuted(ActionExecutedContext filterContext)
        {
        }

        static String GetUserCulture(ActionExecutingContext filterContext)
        {
            String cultureCode = DefaultCulture;
            if (filterContext.RouteData.Values.ContainsKey("language"))
                cultureCode = Language.LanguageCulture(filterContext.RouteData.Values["language"].ToString());
            else if (!String.IsNullOrWhiteSpace(filterContext.RequestContext.HttpContext.Request["language"]))
                cultureCode = Language.LanguageCulture(filterContext.RequestContext.HttpContext.Request["language"]);
            return cultureCode;
        }

        internal static void SetUserCulture(HttpContextBase context, String cultureCode)
        {
            context.Items["Culture"] = cultureCode;

            CultureInfo culture = new CultureInfo(cultureCode);
            System.Threading.Thread.CurrentThread.CurrentCulture = culture;
            System.Threading.Thread.CurrentThread.CurrentUICulture = culture;
        }
    }
}
