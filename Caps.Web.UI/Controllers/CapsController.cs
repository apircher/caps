using Caps.Data;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.Mvc;
using Caps.Web.UI.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using WebMatrix.WebData;

namespace Caps.Web.UI.Controllers
{
    [SetUserActivity]
    public class CapsController : Controller
    {
        CapsDbContext db;

        public CapsController()
            : this(new CapsDbContext()) 
        {

        }
        public CapsController(CapsDbContext context) 
        {
            this.db = context;
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
                var userName = User.Identity.Name;
                if (WebSecurity.UserExists(userName) || !LockoutHelper.IsAuthorLockedOut(userName))
                    return Json(new AuthenticatedUserModel(db.GetCurrentAuthor()));
            }

            return Json(new AuthenticatedUserModel());
        }

        [HttpPost, ValidateJsonAntiForgeryToken]
        public JsonResult Logon(LoginModel model) 
        {
            if (ModelState.IsValid)
            {
                if (LockoutHelper.IsAuthorLockedOut(model.UserName))
                    return Json(new LogonResponseModel("ERROR_LOCKED"));

                if (WebSecurity.Login(model.UserName, model.Password, persistCookie: model.RememberMe))
                {
                    var author = db.GetAuthorByUserName(model.UserName);
                    author.RegisterLogin();
                    db.SaveChanges();

                    return Json(new LogonResponseModel(db.GetAuthorByUserName(model.UserName)));
                }

                return Json(new LogonResponseModel("ERROR_USER_OR_PASSWORD_INVALID"));
            }

            return Json(new LogonResponseModel("Bad request"));
        }

        [HttpPost, Authorize, ValidateJsonAntiForgeryToken]
        public JsonResult Logoff() 
        {
            WebSecurity.Logout();
            return Json(new LogonResponseModel());
        }

        [HttpPost, Authorize, ValidateJsonAntiForgeryToken]
        public JsonResult ChangePassword(ChangePasswordModel model) 
        {
            if (!ModelState.IsValid)
                return Json(new ChangePasswordResponse { Error = "Bad request" });

            if (WebSecurity.ChangePassword(User.Identity.Name, model.OldPassword, model.NewPassword))
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
