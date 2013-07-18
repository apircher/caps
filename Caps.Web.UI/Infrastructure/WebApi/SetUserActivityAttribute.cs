using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http.Filters;
using System.Web.Security;

namespace Caps.Web.UI.Infrastructure.WebApi
{
    public class SetUserActivityAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(System.Web.Http.Controllers.HttpActionContext actionContext)
        {
            var httpContext = HttpContext.Current;
            if (httpContext.Request.IsAuthenticated)
            {
                var user = Membership.GetUser(httpContext.User.Identity.Name, true);
                httpContext.Items["MembershipUser"] = user;
            }

            base.OnActionExecuting(actionContext);
        }
    }
}