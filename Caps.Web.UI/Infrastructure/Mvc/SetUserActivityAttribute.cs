using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace Caps.Web.UI.Infrastructure.Mvc
{
    public class SetUserActivityAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var httpContext = filterContext.RequestContext.HttpContext;
            if (httpContext.Request.IsAuthenticated)
            {
                var user = Membership.GetUser(httpContext.User.Identity.Name, true);
                httpContext.Items["MembershipUser"] = user;
            }

            base.OnActionExecuting(filterContext);
        }
    }
}