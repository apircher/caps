using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.Mvc;
using Caps.Web.UI.Models;
using Microsoft.AspNet.Identity;
using Microsoft.Owin.Security;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace Caps.Web.UI.Controllers
{
    [SetUserActivity, OutputCache(VaryByParam = "*", Duration = 0, NoStore = true)]
    public class CapsController : Controller
    {
        CapsDbContext db;
        UserManager<Author> userManager;

        public CapsController(CapsDbContext context, UserManager<Author> userManager) 
        {
            this.db = context;
            this.userManager = userManager;
        }

        //
        // GET: /Caps/

        public ActionResult Index() 
        {
            return View();
        }

        [HttpPost, ValidateJsonAntiForgeryToken]
        public JsonResult GetAuthenticationMetadata() 
        {
            return Json(new AuthenticationMetadata
            {
                LockoutPeriod = Settings.LockoutPeriod,
                MinRequiredPasswordLength = 6
            });
        }

        [HttpPost, ValidateJsonAntiForgeryToken]
        public ActionResult GetCurrentUser() 
        {
            if (Request.IsAuthenticated)
            {
                var users = db.Users as System.Data.Entity.DbSet<Author>;
                var user = users.Include("Roles.Role").FirstOrDefault(u => u.UserName == User.Identity.Name);
                if (user != null && !userManager.IsUserLockedOut(user))
                    return Json(new AuthenticatedUserModel(user));
            }

            return Json(new AuthenticatedUserModel());
        }

        private IAuthenticationManager AuthenticationManager
        {
            get
            {
                return HttpContext.GetOwinContext().Authentication;
            }
        }

        [HttpPost, ValidateJsonAntiForgeryToken]
        public JsonResult Logon(LoginModel model) 
        {
            if (ModelState.IsValid)
            {
                if (userManager.IsUserLockedOut(model.UserName))
                    return Json(new LogonResponseModel("ERROR_LOCKED"));

                var user = userManager.FindByName(model.UserName);
                LogonResponseModel logonResponse = new LogonResponseModel("ERROR_USER_OR_PASSWORD_INVALID");

                if (user != null)
                {
                    var r = userManager.PasswordHasher.VerifyHashedPassword(user.PasswordHash, model.Password);
                    if (r != PasswordVerificationResult.Failed)
                    {
                        var identity = userManager.CreateIdentity(user, DefaultAuthenticationTypes.ApplicationCookie);
                        AuthenticationManager.SignIn(new AuthenticationProperties() { IsPersistent = model.RememberMe }, identity);

                        user.LastPasswordFailureDate = null;
                        user.PasswordFailuresSinceLastSuccess = 0;

                        user.RegisterLogin();

                        logonResponse = new LogonResponseModel(user);
                    }
                    else
                    {
                        user.LastPasswordFailureDate = DateTime.UtcNow;
                        user.PasswordFailuresSinceLastSuccess++;
                    }
                    db.SaveChanges();
                }

                return Json(logonResponse);
            }

            return Json(new LogonResponseModel("Bad request"));
        }

        [HttpPost, Authorize, ValidateJsonAntiForgeryToken]
        public JsonResult Logoff() 
        {
            AuthenticationManager.SignOut();
            return Json(new LogonResponseModel());
        }

        [HttpPost, Authorize, ValidateJsonAntiForgeryToken]
        public JsonResult ChangePassword(ChangePasswordModel model) 
        {
            if (!ModelState.IsValid)
                return Json(new ChangePasswordResponse { Error = "Bad request" });

            var user = userManager.Find(User.Identity.Name, model.OldPassword);
            if (user == null)
                return Json(new ChangePasswordResponse { Error = "Bad request" });

            var r = userManager.ChangePassword(user.Id, model.OldPassword, model.NewPassword);
            if (r.Succeeded)
            {
                user.LastPasswordChangedDate = DateTime.UtcNow;
                db.SaveChanges();

                return Json(new ChangePasswordResponse { Success = true });
            }

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
