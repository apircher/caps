using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Security;

namespace Caps.Web.UI.Controllers
{
    [Authorize, ValidateJsonAntiForgeryToken, SetUserActivity]
    public class UserMgmtController : ApiController
    {
        [HttpPost, Authorize(Roles = "Administrator")]
        public HttpResponseMessage IsUserNameUnique(PropertyValidationModel model)
        {
            // Load user.
            var user = Membership.GetUser(model.Value, false);
            if (user == null)
                return Request.CreateResponse(HttpStatusCode.OK, true);
            return Request.CreateResponse(HttpStatusCode.OK, false);
        }

        [HttpGet]
        public HttpResponseMessage GetAllRoles()
        {
            return Request.CreateResponse(HttpStatusCode.OK, Roles.GetAllRoles()); 
        }

        [HttpPost, Authorize(Roles = "Administrator")]
        public HttpResponseMessage UnlockUser(UnlockUserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var user = Membership.GetUser(model.UserName, false);
            if (user == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);
            var result = user.UnlockUser();
            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(user));
        }

        [HttpPost, Authorize(Roles = "Administrator")]
        public HttpResponseMessage SetPassword(SetPasswordModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var user = Membership.GetUser(model.UserName, false);
            if (user == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var randomPassword = user.ResetPassword();
            user.ChangePassword(randomPassword, model.NewPassword);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
