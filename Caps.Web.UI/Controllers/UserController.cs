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
    [Authorize(Roles = "Administrator"), ValidateJsonAntiForgeryToken, SetUserActivity]
    public class UserController : ApiController
    {
        public IList<UserModel> GetAll()
        {
            var users = Membership.GetAllUsers();
            return users.Cast<MembershipUser>().Select(u => new UserModel(u, Roles.GetRolesForUser(u.UserName))).ToList();
        }

        public HttpResponseMessage Get(String id)
        {
            // Load User.
            var user = Membership.GetUser(id, false);
            if (user == null)
                return Request.CreateResponse(HttpStatusCode.BadRequest);            
            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(user, Roles.GetRolesForUser(user.UserName)));
        }

        public HttpResponseMessage Put(UserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            // Ensure unique username.
            if (Membership.FindUsersByName(model.UserName).Count > 0)
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = "Der Benutzername ist bereits vergeben.", ErrorId = "duplicate_username" });

            // Add the user.
            MembershipUser user;
            try
            {
                user = Membership.CreateUser(model.UserName, model.Password);
            }
            catch (MembershipCreateUserException)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = "Der Benutzer konnte nicht erstellt werden.", ErrorId = "createuser_exception" });
            }

            model.UpdateMembershipUser(user);
            Membership.UpdateUser(user);

            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(user));
        }

        public HttpResponseMessage Post(UserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            // Load user.
            var user = Membership.GetUser(model.UserName, false);
            if (user == null)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            try
            {
                model.UpdateMembershipUser(user);
            }
            catch (InvalidOperationException ex)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = ex.Message, ErrorId = "updateuser_exception" });
            }
            Membership.UpdateUser(user);

            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(user));
        }

        public HttpResponseMessage Delete(UserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var user = Membership.GetUser(model.UserName, false);
            if (String.Equals(user.UserName, System.Web.HttpContext.Current.User.Identity.Name))
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            try
            {
                Membership.DeleteUser(model.UserName);
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, 
                    new { ErrorMessage = "Beim Löschen des Benutzers ist eine unbehandelte Ausnahme aufgetreten.", ErrorId = "deleteuser_exception" });
            }
        }
    }
}
