using Caps.Data;
using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http.Filters;
using System.Web.Security;
using WebMatrix.WebData;
using Caps.Web.UI.Infrastructure;

namespace Caps.Web.UI.Infrastructure.WebApi
{
    public class SetUserActivityAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(System.Web.Http.Controllers.HttpActionContext actionContext)
        {
            var httpContext = HttpContext.Current;
            if (httpContext.Request.IsAuthenticated)
            {
                using (var db = new CapsDbContext())
                {
                    var author = db.GetCurrentAuthor();
                    if (author != null)
                    {
                        author.RegisterActivity();
                        db.SaveChanges();
                    }
                }
            }

            base.OnActionExecuting(actionContext);
        }
    }
}