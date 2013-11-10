using Caps.Data.Localization;
using Caps.Data.Model;
using Caps.Data.Utils;
using Caps.Web.Mvc.Sitemap;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Configuration.Provider;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Caching;
using System.Web.Routing;

namespace Caps.Web.Mvc.Providers
{
    public class CapsSitemapProvider : StaticSiteMapProvider
    {
        const string cacheKey = "__CapsSiteMapProvider";

        static String initialLanguage = Language.CurrentLanguage;
        readonly object synclock = new object();

        SiteMapNode rootNode;
        DateTime siteMapExpiration = DateTime.MaxValue;
        IDictionary<int, SiteMapNode> nodeIdIndex;
        IDictionary<String, SiteMapNode> nodeNameIndex;

        public override void Initialize(String name, NameValueCollection config)
        {
            // Verify that config isn't null
            if (config == null)
                throw new ArgumentNullException("config");

            // Assign the provider a default name if it doesn't have one
            if (String.IsNullOrEmpty(name))
                name = "CapsSiteMapProvider";

            // Add a default "description" attribute to config if the
            // attribute doesn’t exist or is empty
            if (string.IsNullOrEmpty(config["description"]))
            {
                config.Remove("description");
                config.Add("description", "Stellt Übersichts-Daten aus SQL-Server bereit.");
            }

            // Call the base class's Initialize method
            base.Initialize(name, config);

            EnableLocalization = true;

            // Initialize SQL cache dependency
            // Not available on Sql Azure.
            //SqlDependency.Start(connectionString);

            // SiteMapProvider processes the securityTrimmingEnabled
            // attribute but fails to remove it. Remove it now so we can
            // check for unrecognized configuration attributes.
            if (config["securityTrimmingEnabled"] != null)
                config.Remove("securityTrimmingEnabled");

            // Throw an exception if unrecognized attributes remain
            if (config.Count > 0)
            {
                string attr = config.GetKey(0);
                if (!String.IsNullOrEmpty(attr))
                    throw new ProviderException("Unrecognized attribute: " + attr);
            }
        }
        public override SiteMapNode BuildSiteMap()
        {
            lock (synclock)
            {
                if (siteMapExpiration <= DateTime.UtcNow)
                {
                    siteMapExpiration = DateTime.MaxValue;
                    ResetSiteMap();
                }

                // Return immediately if this method has been called before
                if (rootNode != null)
                    return rootNode;

                using (CapsSiteMapBuilder builder = new CapsSiteMapBuilder())
                {
                    var result = builder.BuildSitemap(this, (n1, n2) => AddNode(n1, n2));
                    if (result != null)
                    {
                        rootNode = result.RootNode;
                        siteMapExpiration = result.SiteMapExpiration;
                        nodeIdIndex = result.IndexIdToNode;
                        nodeNameIndex = result.IndexNameToNode;
                    }
                    else
                    {
                        rootNode = new CapsSiteMapNode(this, "root");
                        rootNode.Title = "Home";
                        rootNode.Url = "~/";
                        AddNode(rootNode);

                        siteMapExpiration = DateTime.UtcNow.AddMinutes(1);
                        nodeIdIndex = new Dictionary<int, SiteMapNode>();
                        nodeNameIndex = new Dictionary<String, SiteMapNode>();
                    }
                }

                // Add SqlCacheDependency
                // Auf Sql Azure nicht verfügbar.
                using (CacheDependency dependency = new PollingCacheDependency(10000, "CapsDbContext", "DbSiteMaps", "DbSiteMapNodes", "DbSiteMapNodeResources"))
                {
                    HttpRuntime.Cache.Insert(cacheKey, "", dependency, Cache.NoAbsoluteExpiration, Cache.NoSlidingExpiration, CacheItemPriority.NotRemovable,
                        (key, item, reason) => ResetSiteMap());
                }

                return rootNode;
            }
        }

        public override SiteMapNode FindSiteMapNode(HttpContext context)
        {
            // Node
            SiteMapNode node = null;
            String url = String.Empty;

            // Fetch route data
            var httpContext = new HttpContextWrapper(context);
            var routeData = RouteTable.Routes.GetRouteData(httpContext);
            if (routeData != null)
            {
                var routeValues = routeData.Values;

                if (String.Equals(routeValues["controller"], "Home") && String.Equals(routeValues["action"], "Index"))
                    node = RootNode;
                else
                {
                    if (routeValues.ContainsKey("language")) routeValues["language"] = CapsSiteMapNode.LanguagePlaceHolder;
                    VirtualPathData vpd = routeData.Route.GetVirtualPath(new RequestContext(httpContext, routeData), routeValues);
                    url = ("~/" + vpd.VirtualPath).Replace(CapsSiteMapNode.LanguagePlaceHolder, initialLanguage);
                    node = base.FindSiteMapNode(VirtualPathUtility.ToAbsolute(url));
                }
            }
            return node;
        }
        public DbSiteMapNode FindSitemapNode(String name)
        {
            EnsureSiteMapBuilt();
            if (nodeNameIndex.ContainsKey(name))
            {
                var capsNode = nodeNameIndex[name] as CapsSiteMapNode;
                if (capsNode != null) return capsNode.Entity;
            }
            return null;
        }

        protected override SiteMapNode GetRootNodeCore()
        {
            return BuildSiteMap();
        }

        void EnsureSiteMapBuilt()
        {
            if (rootNode == null)
            {
                // Force BuildSiteMap
                BuildSiteMap();
            }
        }
        void ResetSiteMap()
        {
            rootNode = null;
            Clear();
        }
    }
}
