using CacheCow.Client;
using CacheCow.Common;
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
        static ICacheStore globalStore = new InMemoryCacheStore();
        
        public CapsHttpClient(Uri serviceUri, String userName, String password) :
            base(new CachingHandler(globalStore) { InnerHandler = new RetryHandler(new CapsAccessTokenHandler(new HttpClientHandler(), serviceUri, userName, password)) })
        {
            BaseAddress = serviceUri;

            DefaultRequestHeaders.Accept.Clear();
            DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        public async Task<UserModel> GetUserInfo() 
        {
            var response = await GetAsync("api/account/userinfo");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsAsync<UserModel>();
        }
    }
}
