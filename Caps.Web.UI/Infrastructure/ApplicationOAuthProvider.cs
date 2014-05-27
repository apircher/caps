using Caps.Data;
using Caps.Data.Model;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    public class ApplicationOAuthProvider : OAuthAuthorizationServerProvider
    {
        private readonly string _publicClientId;

        public ApplicationOAuthProvider(string publicClientId)
        {
            if (publicClientId == null)
            {
                throw new ArgumentNullException("publicClientId");
            }

            _publicClientId = publicClientId;
        }

        public override async Task GrantResourceOwnerCredentials(OAuthGrantResourceOwnerCredentialsContext context)
        {
            var db = context.OwinContext.Get<CapsDbContext>();
            var userManager = context.OwinContext.GetUserManager<ApplicationUserManager>();

            Author user = await userManager.FindByNameAsync(context.UserName);
            if (user == null)
            {
                context.SetError("invalid_grant", "Der Benutzername oder das Kennwort ist falsch.");
                return;
            }
            else
            {
                if (LockoutHelper.IsUserLockedOut(userManager, user))
                {
                    context.SetError("invalid_grant", "Das Konto wurde aufgrund zu vieler ungültiger Anmeldeversuche vorübergehend gesperrt. Die Sperre wird nach " 
                        + Settings.LockoutPeriod.ToString() + " Minuten automatisch aufgehoben");
                    return;
                }

                var r = userManager.PasswordHasher.VerifyHashedPassword(user.PasswordHash, context.Password);
                if (r == PasswordVerificationResult.Failed)
                {
                    context.SetError("invalid_grant", "Der Benutzername oder das Kennwort ist falsch.");
                    user.LastPasswordFailureDate = DateTime.UtcNow;
                    user.PasswordFailuresSinceLastSuccess++;
                    db.SaveChanges();
                    return;
                }

                user.LastPasswordFailureDate = null;
                user.PasswordFailuresSinceLastSuccess = 0;
                user.RegisterLogin();
                db.SaveChanges();
            }

            ClaimsIdentity oAuthIdentity = await userManager.CreateIdentityAsync(user, context.Options.AuthenticationType);
            ClaimsIdentity cookiesIdentity = await userManager.CreateIdentityAsync(user, CookieAuthenticationDefaults.AuthenticationType);

            AuthenticationProperties properties = CreateProperties(user.UserName);
            AuthenticationTicket ticket = new AuthenticationTicket(oAuthIdentity, properties);
            context.Validated(ticket);

            bool isPersistent = ShouldCreatePersistentCookie(context.Request);
            context.Request.Context.Authentication.SignIn(new AuthenticationProperties { IsPersistent = isPersistent }, cookiesIdentity);
        }

        bool ShouldCreatePersistentCookie(Microsoft.Owin.IOwinRequest request)
        {
            if (request.Query["rememberMe"] == null)
                return false;
            
            bool b;
            if (bool.TryParse(request.Query["rememberMe"], out b))
                return b;

            return false;
        }

        public override Task TokenEndpoint(OAuthTokenEndpointContext context)
        {
            foreach (KeyValuePair<string, string> property in context.Properties.Dictionary)
            {
                context.AdditionalResponseParameters.Add(property.Key, property.Value);
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateClientAuthentication(OAuthValidateClientAuthenticationContext context)
        {
            // Die Kennwortanmeldeinformationen des Ressourcenbesitzers stellen keine Client-ID zur Verfügung.
            if (context.ClientId == null)
            {
                context.Validated();
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateClientRedirectUri(OAuthValidateClientRedirectUriContext context)
        {
            if (context.ClientId == _publicClientId)
            {
                Uri expectedRootUri = new Uri(context.Request.Uri, "/");

                if (expectedRootUri.AbsoluteUri == context.RedirectUri)
                {
                    context.Validated();
                }
            }

            return Task.FromResult<object>(null);
        }

        public static AuthenticationProperties CreateProperties(string userName)
        {
            IDictionary<string, string> data = new Dictionary<string, string>
            {
                { "userName", userName }
            };
            return new AuthenticationProperties(data);
        }
    }
}