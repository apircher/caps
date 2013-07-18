using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace Caps.Web.UI.Infrastructure.WebApi
{
    public class ValidateJsonAntiForgeryTokenAttribute : FilterAttribute, IAuthorizationFilter
    {
        public Task<System.Net.Http.HttpResponseMessage> ExecuteAuthorizationFilterAsync(HttpActionContext actionContext, CancellationToken cancellationToken, Func<Task<HttpResponseMessage>> continuation)
        {
            if (actionContext == null)
                throw new ArgumentNullException("actionContext");
            if (actionContext.Request.Method != HttpMethod.Get)
                return ValidateAntiForgeryToken(actionContext, cancellationToken, continuation);

            return continuation();
        }

        Task<HttpResponseMessage> FromResult(HttpResponseMessage result)
        {
            var source = new TaskCompletionSource<HttpResponseMessage>();
            source.SetResult(result);
            return source.Task;
        }

        Task<HttpResponseMessage> ValidateAntiForgeryToken(HttpActionContext actionContext, CancellationToken cancellationToken, Func<Task<HttpResponseMessage>> continuation)
        {
            try
            {
                String cookieToken = "";
                String formToken = "";
                IEnumerable<String> tokenHeaders;
                if (actionContext.Request.Headers.TryGetValues("RequestVerificationToken", out tokenHeaders))
                {
                    var tokens = tokenHeaders.First().Split(':');
                    if (tokens.Length == 2)
                    {
                        cookieToken = tokens[0].Trim();
                        formToken = tokens[1].Trim();
                    }
                }
                AntiForgery.Validate(cookieToken, formToken);
            }
            catch (System.Web.Mvc.HttpAntiForgeryException)
            {
                actionContext.Response = new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.Forbidden,
                    RequestMessage = actionContext.ControllerContext.Request
                };
                return FromResult(actionContext.Response);
            }

            return continuation();
        }
    }
}