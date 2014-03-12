using Caps.Consumer;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;
using Caps.Consumer.Model;

namespace DemoConsoleApplication
{
    class Program
    {
        static void Main(string[] args)
        {
            DoStuff();

            Console.WriteLine("Drücke eine beliebige Taste um zu beenden...");
            Console.ReadKey();
        }

        static async void DoStuff()
        {
            using (var client = new CapsHttpClient(new Uri("http://localhost:57004"), "apircher", "p@ssword"))
            {
                var success = await client.InitAccessTokens();
                Console.WriteLine("Tokens initialized: {0}", success);

                var user = await client.GetUserInfo();
                Console.WriteLine("Logged in as: {0} {1}", user.FirstName, user.LastName);

                var websites = await client.GetWebsites();
                Console.WriteLine("Found {0} websites.", websites.Length);

                if (websites.Length == 0)
                    return;

                var website = await client.GetWebsite(websites.First().Id);
                Console.WriteLine("Selected: {0} ({1})", website.Name, website.Url);

                var siteMap = await client.GetCurrentSiteMap(websites.First().Id);
                Console.WriteLine("Current SiteMap Version: {0}", siteMap.Version);

                var rootNode = siteMap.SiteMapNodes.FirstOrDefault(n => n.ParentNodeId == null);
                if (rootNode == null)
                {
                    Console.WriteLine("Startseite nicht gefunden.");
                    return;
                }

                PrintSiteMapNode(rootNode);
            }
        }

        static void PrintSiteMapNode(DbSiteMapNode node, int level = 0)
        {
            String indent = new String(' ', level);            
            Console.WriteLine(indent + "{0}: {1}", node.PermanentId, node.Name);

            if (node.ChildNodes != null)
            {
                foreach (var n in node.ChildNodes) PrintSiteMapNode(n, level + 1);
            }
        }
    }

    static class Utilities
    {
        public static async Task<Website[]> GetWebsites(this CapsHttpClient client)
        {
            var response = await client.GetAsync("api/websites");
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadAsAsync<Website[]>();
            return null;
        }

        public static async Task<Website> GetWebsite(this CapsHttpClient client, int websiteId)
        {
            var response = await client.GetAsync("api/websites/" + websiteId.ToString());
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadAsAsync<Website>();
            return null;
        }

        public static async Task<DbSiteMap> GetCurrentSiteMap(this CapsHttpClient client, int websiteId)
        {
            var response = await client.GetAsync("api/websites/" + websiteId.ToString() + "/sitemap");
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadAsAsync<DbSiteMap>();
            return null;
        }
    }
}
