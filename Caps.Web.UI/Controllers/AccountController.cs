using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Models;
using Microsoft.AspNet.Identity;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;
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
        private const string LocalLoginProvider = "Lokal";

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

            String loginProvider = externalLogin != null ? externalLogin.LoginProvider : LocalLoginProvider;
            String providerKey = externalLogin != null ? externalLogin.ProviderKey : User.Identity.GetUserName();
            String userName = externalLogin != null ? externalLogin.UserName : User.Identity.GetUserName();

            var user = userManager.FindByName(User.Identity.GetUserName());
            var roles = user != null ? userManager.GetRoles(user.Id).ToArray() : new String[0];
            return new AuthenticatedUserModel(
                loginProvider, providerKey, userName, roles, user, externalLogin != null
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

        // POST api/account/setpassword

        [Route("setpassword")]
        [ValidateJsonAntiForgeryToken]
        public async Task<IHttpActionResult> SetPassword(SetLocalPasswordModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await userManager.AddPasswordAsync(User.Identity.GetUserId(), model.NewPassword);
            return GetErrorResult(result) ?? Ok();
        }

        // POST api/account/addexternallogin

        [Route("addexternallogin")]
        [ValidateJsonAntiForgeryToken]
        public async Task<IHttpActionResult> AddExternalLogin(AddExternalLoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);
            AuthenticationTicket ticket = accessTokenFormat.Unprotect(model.ExternalAccessToken);

            if (ticket == null || ticket.Identity == null || (ticket.Properties != null
                && ticket.Properties.ExpiresUtc.HasValue
                && ticket.Properties.ExpiresUtc.Value < DateTimeOffset.UtcNow))
                return BadRequest("Fehler bei der externen Anmeldung");

            ExternalLoginData externalData = ExternalLoginData.FromIdentity(ticket.Identity);
            if (externalData == null)
                return BadRequest("Die externe Anmeldung ist bereits einem Konto zugeordnet.");

            var result = await userManager.AddLoginAsync(User.Identity.GetUserId(),
                new UserLoginInfo(externalData.LoginProvider, externalData.ProviderKey));

            var errorResult = GetErrorResult(result);
            if (errorResult != null)
                return errorResult;

            return Ok();
        }

        // POST api/account/removelogin

        [Route("removelogin")]
        [ValidateJsonAntiForgeryToken]
        public async Task<IHttpActionResult> RemoveLogin(RemoveLoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            IdentityResult result;
            if (model.LoginProvider == LocalLoginProvider)
                result = await userManager.RemovePasswordAsync(User.Identity.GetUserId());
            else
                result = await userManager.RemoveLoginAsync(User.Identity.GetUserId(), new UserLoginInfo(model.LoginProvider, model.ProviderKey));
            
            return GetErrorResult(result) ?? Ok();
        }

        // GET api/account/managementinfo

        [Route("managementinfo")]
        public async Task<AccountManagementModel> GetAccountManagementInfo(String returnUrl, bool generateState = false)
        {
            var user = await userManager.FindByIdAsync(User.Identity.GetUserId());
            
            if (user == null) return null;

            var logins = user.Logins.Select(linkedAccount =>
            {
                return new AuthorLoginInfoModel
                {
                    LoginProvider = linkedAccount.LoginProvider,
                    ProviderKey = linkedAccount.ProviderKey
                };
            }).ToList();

            if (user.PasswordHash != null)
            {
                logins.Add(new AuthorLoginInfoModel
                {
                    LoginProvider = LocalLoginProvider,
                    ProviderKey = user.UserName
                });
            }

            return new AccountManagementModel
            {
                LocalLoginProvider = LocalLoginProvider,
                UserName = user.UserName,
                Logins = logins,
                LoginProviders = GetExternalLoginProviders(returnUrl, generateState)
            };
        }

        // GET api/account/externallogins

        [AllowAnonymous]
        [Route("externallogins")]
        public IEnumerable<ExternalLoginModel> GetExternalLoginProviders(String returnUrl, bool generateState = false)
        {
            var descriptions = Authentication.GetExternalAuthenticationTypes();
            var logins = new List<ExternalLoginModel>();
            var state = generateState ? RandomOAuthStateGenerator.Generate(256) : null;

            foreach (var description in descriptions)
            {
                var vm = new ExternalLoginModel
                {
                    Name = description.Caption,
                    Url = Url.Route("ExternalLogin", new
                    {
                        provider = description.AuthenticationType,
                        response_type = "token",
                        client_id = Startup.PublicClientId,
                        redirect_uri = new Uri(Request.RequestUri, returnUrl).AbsoluteUri,
                        state = state
                    }),
                    State = state
                };
                logins.Add(vm);
            }

            return logins;
        }

        // GET api/account/externallogin

        [OverrideAuthentication]
        [HostAuthentication(DefaultAuthenticationTypes.ExternalCookie)]
        [AllowAnonymous]
        [Route("externallogin", Name = "ExternalLogin")]
        public async Task<IHttpActionResult> GetExternalLogin(String provider, String error = null)
        {
            if (error != null)
                return Redirect(Url.Content("~/") + "#error=" + Uri.EscapeDataString(error));

            if (!User.Identity.IsAuthenticated)
                return new ChallengeResult(provider, this);

            ExternalLoginData externalLogin = ExternalLoginData.FromIdentity(User.Identity as ClaimsIdentity);
            if (externalLogin == null)
                return InternalServerError();

            if (externalLogin.LoginProvider != provider)
            {
                Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);
                return new ChallengeResult(provider, this);
            }

            var user = await userManager.FindAsync(new UserLoginInfo(externalLogin.LoginProvider, externalLogin.ProviderKey));
            bool hasRegistered = user != null;

            if (hasRegistered)
            {
                Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);
                ClaimsIdentity oAuthIdentity = await userManager.CreateIdentityAsync(user, OAuthDefaults.AuthenticationType);
                ClaimsIdentity cookieIdentity = await userManager.CreateIdentityAsync(user, CookieAuthenticationDefaults.AuthenticationType);
                AuthenticationProperties properties = ApplicationOAuthProvider.CreateProperties(user.UserName);
                Authentication.SignIn(properties, oAuthIdentity, cookieIdentity);
            }
            else
            {
                IEnumerable<Claim> claims = externalLogin.GetClaims();
                ClaimsIdentity identity = new ClaimsIdentity(claims, OAuthDefaults.AuthenticationType);
                Authentication.SignIn(identity);
            }

            return Ok();
        }

        protected virtual IAuthenticationManager Authentication
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
