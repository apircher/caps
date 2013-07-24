using Caps.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using Caps.Web.UI.Infrastructure;

namespace Caps.Web.UI.Infrastructure.Mvc
{
    public class SetUserActivityAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var httpContext = filterContext.RequestContext.HttpContext;
            if (httpContext.Request.IsAuthenticated)
            {
                var db = DependencyResolver.Current.GetService<CapsDbContext>();
                var author = db.GetCurrentAuthor();
                if (author != null)
                {
                    author.RegisterActivity();
                    db.SaveChanges();
                }
            }

            base.OnActionExecuting(filterContext);
        }
    }
}