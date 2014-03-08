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
        // GET api/antiforgery/tokens

        [Route("tokens")]
        public HttpResponseMessage GetTokens()
        {
            String cookieToken, formToken;
            System.Web.Helpers.AntiForgery.GetTokens(null, out cookieToken, out formToken);
            return Request.CreateResponse(HttpStatusCode.OK, new { c = cookieToken, f = formToken });
        }
    }
}
