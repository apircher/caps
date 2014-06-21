using Caps.Consumer.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer
{
    public class CapsAccessTokenHandler : DelegatingHandler
    {
        static AntiForgeryTokensModel _antiForgeryToken;
        static String _accessToken;

        Uri serviceUri;
        String userName;
        String password;

        AntiForgeryTokensModel antiForgeryToken;
        String accessToken;

        public CapsAccessTokenHandler(HttpMessageHandler innerHandler, Uri serviceUri, String userName, String password)
            : base(innerHandler)
        {
            this.serviceUri = serviceUri;
            this.userName = userName;
            this.password = password;

            antiForgeryToken = _antiForgeryToken;
            accessToken = _accessToken;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, System.Threading.CancellationToken cancellationToken)
        {
            if (!HasAccessTokens())
                await InitAccessTokens();

            AddHeaders(request.Headers);
            HttpResponseMessage response = await base.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotModified)
                    return response;

                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    await InitAccessTokens();
                    AddHeaders(request.Headers);
                    response = await base.SendAsync(request, cancellationToken);
                }
            }

            return response;
        }

        void AddHeaders(HttpRequestHeaders headers)
        {
            headers.Remove("RequestVerificationToken");
            headers.Add("RequestVerificationToken", String.Format("{0}:{1}", antiForgeryToken.c, antiForgeryToken.f));
            headers.Remove("Authorization");
            headers.Add("Authorization", "Bearer " + accessToken);
        }

        public bool HasAccessTokens()
        {
            return antiForgeryToken != null && !String.IsNullOrWhiteSpace(accessToken);
        }

        async Task<bool> InitAccessTokens()
        {
            if (!HasAccessTokens())
            {
                var client = CreateClient();

                _accessToken = accessToken = await GetAccessToken(client, userName, password);
                if (String.IsNullOrWhiteSpace(accessToken))
                    throw new Exception("Unable to get access token.");

                _antiForgeryToken = antiForgeryToken = await GetAntiForgeryToken(client);
                if (antiForgeryToken == null)
                    throw new Exception("Unable to get antiforgerytokens.");
            }

            return HasAccessTokens();
        }

        async Task<String> GetAccessToken(HttpClient client, String userName, String password)
        {
            var s = String.Format("grant_type=password&username={0}&password={1}", userName, password);

            var response = await client.PostAsync("Token", new StringContent(s, Encoding.UTF8));
            if (response.IsSuccessStatusCode)
            {
                var tokens = await response.Content.ReadAsAsync<AccessTokenModel>();
                return tokens.access_token;
            }
            return null;
        }

        async Task<AntiForgeryTokensModel> GetAntiForgeryToken(HttpClient client)
        {
            var response = await client.GetAsync("api/antiforgery/tokens");
            if (response.IsSuccessStatusCode)
            {
                var tokens = await response.Content.ReadAsAsync<AntiForgeryTokensModel>();
                return tokens;
            }
            return null;
        }

        HttpClient CreateClient()
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.BaseAddress = serviceUri;
            return client;
        }
    }
}
