using Microsoft.Owin.Security.OAuth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    class ApplicationOAuthBearerAuthenticationProvider : OAuthBearerAuthenticationProvider
    {
        string headerKeyName;
        string queryKeyName;

        public ApplicationOAuthBearerAuthenticationProvider(string headerKeyName = "Authorization", string queryKeyName = "access_token")
        {
            this.headerKeyName = headerKeyName;
            this.queryKeyName = queryKeyName;
        }

        public override Task RequestToken(OAuthRequestTokenContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            // Try to get the token from request headers.
            var value = context.Request.Headers.Get(headerKeyName);
            if (!String.IsNullOrWhiteSpace(value))
            {
                if (value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    value = value.Substring(7);
                context.Token = value;
            }
            else
            {
                // Try to get the token from the querystring.
                // This is for browsers that request files without Authorization-Header.
                // Only allow GET-Requests and only for dbfile-operations.
                if (context.Request.Method == "GET" && context.Request.Path.Value.StartsWith("/api/dbfile/", StringComparison.OrdinalIgnoreCase))
                {
                    value = context.Request.Query.Get(queryKeyName);
                    if (!String.IsNullOrWhiteSpace(value))
                        context.Token = value;
                }
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateIdentity(OAuthValidateIdentityContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }
            if (context.Ticket.Identity.Claims.Any(c => c.Issuer != ClaimsIdentity.DefaultIssuer))
            {
                context.Rejected();
            }
            return Task.FromResult<object>(null);

        }
    }

    class ExternalOAuthBearerProvider : OAuthBearerAuthenticationProvider
    {
        public override Task ValidateIdentity(OAuthValidateIdentityContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }
            if (context.Ticket.Identity.Claims.Count() == 0)
            {
                context.Rejected();
            }
            else if (context.Ticket.Identity.Claims.All(c => c.Issuer == ClaimsIdentity.DefaultIssuer))
            {
                context.Rejected();
            }

            return Task.FromResult<object>(null);
        }
    }
}