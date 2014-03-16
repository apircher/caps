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
    public class CapsHttpClient : HttpClient
    {
        static CacheCow.Common.ICacheStore globalStore = new CacheCow.Client.InMemoryCacheStore();

        String userName;
        String password;

        AntiForgeryTokensModel antiForgeryToken;
        String accessToken;

        public CapsHttpClient(Uri serviceUri, String userName, String password) :
            base(new CacheCow.Client.CachingHandler(globalStore) { InnerHandler = new HttpClientHandler() })
        {
            this.userName = userName;
            this.password = password;

            BaseAddress = serviceUri;

            DefaultRequestHeaders.Accept.Clear();
            DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        public async Task<bool> InitAccessTokens() 
        {
            if (!HasAccessTokens())
            {
                accessToken = await GetAccessToken(userName, password);
                if (String.IsNullOrWhiteSpace(accessToken))
                    throw new Exception("Unable to get access token.");

                antiForgeryToken = await GetAntiForgeryToken();
                if (antiForgeryToken == null)
                    throw new Exception("Unable to get antiforgerytokens.");

                DefaultRequestHeaders.Add("RequestVerificationToken", String.Format("{0}:{1}", antiForgeryToken.c, antiForgeryToken.f));
                DefaultRequestHeaders.Add("Authorization", "Bearer " + accessToken);
            }

            return HasAccessTokens();
        }
        public async Task<UserModel> GetUserInfo() 
        {
            var response = await GetAsync("api/account/userinfo");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsAsync<UserModel>();
        }

        public bool HasAccessTokens()
        {
            return antiForgeryToken != null && !String.IsNullOrWhiteSpace(accessToken);
        }

        async Task<AntiForgeryTokensModel> GetAntiForgeryToken() 
        {
            var response = await GetAsync("api/antiforgery/tokens");
            if (response.IsSuccessStatusCode)
            {
                var tokens = await response.Content.ReadAsAsync<AntiForgeryTokensModel>();
                return tokens;
            }
            return null;
        }

        async Task<String> GetAccessToken(String userName, String password) 
        {
            var s = String.Format("grant_type=password&username={0}&password={1}", userName, password);

            var response = await PostAsync("Token", new StringContent(s, Encoding.UTF8));
            if (response.IsSuccessStatusCode)
            {
                var tokens = await response.Content.ReadAsAsync<AccessTokenModel>();
                return tokens.access_token;
            }
            return null;
        }
    }
}
