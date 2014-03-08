using Caps.Data;
using Caps.Data.Model;
using Microsoft.AspNet.Identity;
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
        private readonly Func<UserManager<Author>> _userManagerFactory;
        private readonly Func<CapsDbContext> _dbFactory;

        public ApplicationOAuthProvider(string publicClientId, Func<UserManager<Author>> userManagerFactory, Func<CapsDbContext> dbFactory)
        {
            if (publicClientId == null)
            {
                throw new ArgumentNullException("publicClientId");
            }

            if (userManagerFactory == null)
            {
                throw new ArgumentNullException("userManagerFactory");
            }

            _publicClientId = publicClientId;
            _userManagerFactory = userManagerFactory;
            _dbFactory = dbFactory;
        }

        public override async Task GrantResourceOwnerCredentials(OAuthGrantResourceOwnerCredentialsContext context)
        {
            var db = _dbFactory();
            using (UserManager<Author> userManager = _userManagerFactory())
            {
                Author user = await userManager.FindByNameAsync(context.UserName);
                if (user == null)
                {
                    context.SetError("invalid_grant", "Der Benutzername oder das Kennwort ist falsch.");
                    return;
                }
                else
                {
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

                ClaimsIdentity oAuthIdentity = await userManager.CreateIdentityAsync(user,
                    context.Options.AuthenticationType);
                ClaimsIdentity cookiesIdentity = await userManager.CreateIdentityAsync(user,
                    CookieAuthenticationDefaults.AuthenticationType);
                AuthenticationProperties properties = CreateProperties(user.UserName);
                AuthenticationTicket ticket = new AuthenticationTicket(oAuthIdentity, properties);
                context.Validated(ticket);

                bool isPersistent = ShouldCreatePersistentCookie(context.Request);
                context.Request.Context.Authentication.SignIn(new AuthenticationProperties { IsPersistent = isPersistent }, cookiesIdentity);
            }
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