using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Caps.Web.UI.Controllers
{
    [RoutePrefix("api/antiforgery")]
    public class AntiForgeryTokenController : ApiController
    {
        IAntiForgeryTokenProvider tokenProvider;

        public AntiForgeryTokenController(IAntiForgeryTokenProvider tokenProvider)
        {
            this.tokenProvider = tokenProvider;
        }

        // GET api/antiforgery/tokens

        [Route("tokens")]
        public HttpResponseMessage GetTokens()
        {
            String cookieToken, formToken;
            tokenProvider.GetTokens(null, out cookieToken, out formToken);
            return Request.CreateResponse(HttpStatusCode.OK, new { c = cookieToken, f = formToken });
        }
    }

    public interface IAntiForgeryTokenProvider 
    {
        void GetTokens(String oldCookieToken, out String newCookieToken, out String formToken);
    }

    public class DefaultAntiForgeryTokenProvider : IAntiForgeryTokenProvider 
    {
        public void GetTokens(string oldCookieToken, out string newCookieToken, out string formToken)
        {
            newCookieToken = null;
            formToken = null;
            System.Web.Helpers.AntiForgery.GetTokens(oldCookieToken, out newCookieToken, out formToken);
        }
    }
}
