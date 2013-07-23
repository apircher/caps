using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Security;
using WebMatrix.WebData;

namespace Caps.Web.UI.Controllers
{
    [Authorize, ValidateJsonAntiForgeryToken, SetUserActivity]
    public class UserMgmtController : ApiController
    {
        [HttpPost, Authorize(Roles = "Administrator")]
        public HttpResponseMessage IsUserNameUnique(PropertyValidationModel model)
        {
            if (!WebSecurity.UserExists(model.Value))
                return Request.CreateResponse(HttpStatusCode.OK, true);
            return Request.CreateResponse(HttpStatusCode.OK, false);
        }

        [HttpGet]
        public HttpResponseMessage GetAllRoles()
        {
            return Request.CreateResponse(HttpStatusCode.OK, Roles.GetAllRoles()); 
        }

        [HttpPost, Authorize(Roles = "Administrator")]
        public HttpResponseMessage SetPassword(SetPasswordModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            if (!WebSecurity.UserExists(model.UserName))
                return Request.CreateResponse(HttpStatusCode.NotFound);
            
            var token = WebSecurity.GeneratePasswordResetToken(model.UserName);
            WebSecurity.ResetPassword(token, model.NewPassword);

            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
