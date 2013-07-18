﻿using Caps.Web.UI.Infrastructure.Mvc;
using Caps.Web.UI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace Caps.Web.UI.Controllers
{
    [SetUserActivity]
    public class CapsController : Controller
    {
        //
        // GET: /Caps/

        public ActionResult Index()
        {
            return View();
        }

        [HttpPost, ValidateJsonAntiForgeryToken]
        public ActionResult GetCurrentUser()
        {
            if (!Request.IsAuthenticated)
                return Json(new AuthenticatedUserModel());
            else
            {
                // Sets the User State to "Online".
                var user = Membership.GetUser(User.Identity.Name, true);

                if (user == null || user.IsLockedOut)
                    return Json(new AuthenticatedUserModel());

                var roles = Roles.GetRolesForUser(User.Identity.Name);
                return Json(new AuthenticatedUserModel(true, user.UserName, roles));
            }
        }

        [HttpPost, ValidateJsonAntiForgeryToken]
        public JsonResult Logon(LoginModel model)
        {
            if (ModelState.IsValid)
            {
                if (Membership.ValidateUser(model.UserName, model.Password))
                {
                    FormsAuthentication.SetAuthCookie(model.UserName, model.RememberMe);
                    return Json(new LogonResponseModel(true, model.UserName));
                }
                else
                    return Json(new LogonResponseModel("Benutzername oder Passwort ungültig."));
            }
            return Json(new LogonResponseModel("Bad request"));
        }

        [HttpPost, Authorize, ValidateJsonAntiForgeryToken]
        public JsonResult Logoff()
        {
            FormsAuthentication.SignOut();
            return Json(new LogonResponseModel());
        }

        [HttpPost, Authorize, ValidateJsonAntiForgeryToken]
        public JsonResult ChangePassword(ChangePasswordModel model)
        {
            if (!ModelState.IsValid)
                return Json(new ChangePasswordResponse { Error = "Bad request" });

            var user = Membership.GetUser(User.Identity.Name);
            if (user.ChangePassword(model.OldPassword, model.NewPassword))
                return Json(new ChangePasswordResponse { Success = true });

            return Json(new ChangePasswordResponse { Success = false, Error = "Internal error" });
        }

        [HttpPost]
        public JsonResult GetAntiForgeryToken()
        {
            String cookieToken, formToken;
            System.Web.Helpers.AntiForgery.GetTokens(null, out cookieToken, out formToken);
            return Json(new { c = cookieToken, f = formToken });
        }
    }
}
