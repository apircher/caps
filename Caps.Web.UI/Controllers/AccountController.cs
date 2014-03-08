using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Models;
using Microsoft.AspNet.Identity;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web.Http;

namespace Caps.Web.UI.Controllers
{
    [Authorize]
    [RoutePrefix("api/account")]
    [SetUserActivity]
    public class AccountController : ApiController
    {
        UserManager<Author> userManager;
        ISecureDataFormat<AuthenticationTicket> accessTokenFormat;
        CapsDbContext db;

        public AccountController(UserManager<Author> userManager, CapsDbContext db)
        {
            this.userManager = userManager;
            this.accessTokenFormat = Startup.OAuthOptions.AccessTokenFormat;
            this.db = db;
        }

        // GET api/account/userinfo

        [HostAuthentication(DefaultAuthenticationTypes.ExternalBearer)]
        [Route("userinfo")]
        [ValidateJsonAntiForgeryToken]
        public AuthenticatedUserModel GetUserInfo()
        {
            ExternalLoginData externalLogin = ExternalLoginData.FromIdentity(User.Identity as ClaimsIdentity);
            var user = userManager.FindByName(User.Identity.GetUserName());
            return new AuthenticatedUserModel(
                user, 
                externalLogin == null, 
                externalLogin != null ? externalLogin.LoginProvider : null
            );
        }

        // GET api/account/authmetadata

        [Route("authmetadata")]
        [ValidateJsonAntiForgeryToken]
        [AllowAnonymous]
        public AuthenticationMetadata GetAuthenticationMetadata()
        {
            return new AuthenticationMetadata
            {
                LockoutPeriod = Caps.Web.UI.Infrastructure.Settings.LockoutPeriod,
                MinRequiredPasswordLength = 6
            };
        }

        // POST api/account/logout

        [Route("logout")]
        [ValidateJsonAntiForgeryToken]
        public IHttpActionResult Logout()
        {
            Authentication.SignOut(CookieAuthenticationDefaults.AuthenticationType);
            return Ok();
        }

        // POST api/account/changepassword

        [Route("changepassword")]
        [ValidateJsonAntiForgeryToken]
        public async Task<IHttpActionResult> ChangePassword(ChangePasswordModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var r = await userManager.ChangePasswordAsync(User.Identity.GetUserId(), model.OldPassword, model.NewPassword);
            if (r.Succeeded)
            {
                var user = await userManager.FindByNameAsync(User.Identity.GetUserName());
                user.LastPasswordChangedDate = DateTime.UtcNow;
                db.SaveChanges();
            }
            return GetErrorResult(r) ?? Ok();
        }



        private IAuthenticationManager Authentication
        {
            get { return Request.GetOwinContext().Authentication; }
        }

        private IHttpActionResult GetErrorResult(IdentityResult result)
        {
            if (result == null)
            {
                return InternalServerError();
            }

            if (!result.Succeeded)
            {
                if (result.Errors != null)
                {
                    foreach (string error in result.Errors)
                    {
                        ModelState.AddModelError("", error);
                    }
                }

                if (ModelState.IsValid)
                {
                    // Es sind keine ModelState-Fehler zum Senden verfügbar, daher nur eine leere "BadRequest" zurückgeben.
                    return BadRequest();
                }

                return BadRequest(ModelState);
            }

            return null;
        }

        private class ExternalLoginData
        {
            public String LoginProvider { get; set; }
            public String ProviderKey { get; set; }
            public String UserName { get; set; }

            public IList<Claim> GetClaims()
            {
                IList<Claim> claims = new List<Claim>();

                claims.Add(new Claim(ClaimTypes.NameIdentifier, ProviderKey, null, LoginProvider));

                if (!String.IsNullOrWhiteSpace(UserName))
                    claims.Add(new Claim(ClaimTypes.Name, UserName, null, LoginProvider));
                
                return claims;
            }

            public static ExternalLoginData FromIdentity(ClaimsIdentity identity)
            {
                if (identity == null) 
                    return null;

                Claim providerKeyClaim = identity.FindFirst(ClaimTypes.NameIdentifier);
                if (providerKeyClaim == null || String.IsNullOrEmpty(providerKeyClaim.Issuer) || String.IsNullOrEmpty(providerKeyClaim.Value))
                    return null;

                if (providerKeyClaim.Issuer == ClaimsIdentity.DefaultIssuer)
                    return null;

                return new ExternalLoginData
                {
                    LoginProvider = providerKeyClaim.Issuer,
                    ProviderKey = providerKeyClaim.Value,
                    UserName = identity.FindFirstValue(ClaimTypes.Name)
                };
            }
        }
    }
}
