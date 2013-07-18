using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;

namespace Caps.Web.UI.Infrastructure.Mvc
{
    public class ValidateJsonAntiForgeryTokenAttribute : FilterAttribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationContext filterContext)
        {
            if (!String.Equals(filterContext.HttpContext.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                ValidateAntiForgeryToken(filterContext);
            }
        }

        void ValidateAntiForgeryToken(AuthorizationContext filterContext)
        {
            String cookieToken = "";
            String formToken = "";
            var tokenHeaders = filterContext.HttpContext.Request.Headers["RequestVerificationToken"];
            if (!String.IsNullOrWhiteSpace(tokenHeaders)) 
            {
                var tokens = tokenHeaders.Split(':');
                if (tokens.Length == 2)
                {
                    cookieToken = tokens[0].Trim();
                    formToken = tokens[1].Trim();
                }
            }
            AntiForgery.Validate(cookieToken, formToken);
        }
    }
}