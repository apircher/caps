using Caps.Consumer.Model;
using Caps.Consumer.Mvc.SiteMap;
using Caps.Consumer.Localization;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Caching;
using System.Web.Mvc;
using System.Web.Routing;
using System.Configuration.Provider;
using Caps.Consumer.Mvc.Utils;

namespace Caps.Consumer.Mvc.Providers
{
    public class CapsSiteMapProvider : StaticSiteMapProvider
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

        public bool IsBuildingSiteMap
        {
            get;
            set;
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

                // Build the SiteMap.
                using (ISiteMapBuilder builder = GetBuilder())
                {
                    try
                    {
                        IsBuildingSiteMap = true;
                        var result = builder.BuildSiteMap(this, (n1, n2) => AddNode(n1, n2));
                        if (result != null)
                        {
                            rootNode = result.RootNode;
                            siteMapExpiration = result.SiteMapExpiration;
                            nodeIdIndex = result.IndexIdToNode;
                            nodeNameIndex = result.IndexNameToNode;
                        }
                        else
                        {
                            rootNode = AddDefaultRootNode();
                            siteMapExpiration = DateTime.UtcNow.AddMinutes(1);
                            nodeIdIndex = new Dictionary<int, SiteMapNode>();
                            nodeNameIndex = new Dictionary<String, SiteMapNode>();
                        }
                    }
                    finally
                    {
                        IsBuildingSiteMap = false;
                    }
                }

                // Add CacheDependency
                //using (CacheDependency dependency = new PollingCacheDependency(10000, "CapsDbContext", "DbSiteMaps", "DbSiteMapNodes", "DbSiteMapNodeResources"))
                //{
                //    HttpRuntime.Cache.Insert(cacheKey, "", dependency, Cache.NoAbsoluteExpiration, Cache.NoSlidingExpiration, CacheItemPriority.NotRemovable,
                //        (key, item, reason) => ResetSiteMap());
                //}
                HttpRuntime.Cache.Insert(cacheKey, "", null, DateTime.Now.Add(TimeSpan.FromSeconds(10)), Cache.NoSlidingExpiration, CacheItemPriority.NotRemovable,
                        (key, item, reason) => ResetSiteMap());

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
                    if (routeValues.ContainsKey("language"))
                        routeValues["language"] = CapsSiteMapNode.LanguagePlaceHolder;
                    if (routeValues.ContainsKey("name"))
                        routeValues["name"] = CapsSiteMapNode.LocalizedNamePlaceHolder;

                    VirtualPathData vpd = routeData.Route.GetVirtualPath(new RequestContext(httpContext, routeData), routeValues);
                    url = "~/" + vpd.VirtualPath
                        .Replace(CapsSiteMapNode.LanguagePlaceHolder, Language.DefaultLanguage);
                    node = base.FindSiteMapNode(VirtualPathUtility.ToAbsolute(url));
                }
            }
            return node;
        }
        public DbSiteMapNode FindSiteMapNodeByName(String name)
        {
            EnsureSiteMapBuilt();
            var key = name.UrlEncode();
            if (nodeNameIndex.ContainsKey(key))
            {
                var capsNode = nodeNameIndex[key] as CapsSiteMapNode;
                if (capsNode != null) return capsNode.Entity;
            }
            return null;
        }
        public SiteMapNode FindSiteMapNode(int permanentId)
        {
            EnsureSiteMapBuilt();
            if (nodeIdIndex.ContainsKey(permanentId))
                return nodeIdIndex[permanentId];
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
        ISiteMapBuilder GetBuilder()
        {
            var builder = DependencyResolver.Current.GetService<ISiteMapBuilder>();
            return builder ?? DependencyResolver.Current.GetService<DefaultSiteMapBuilder>();
        }
        CapsSiteMapNode AddDefaultRootNode()
        {
            var node = new CapsSiteMapNode(this, "root");
            node.Title = "Home";
            node.Url = "~/";

            AddNode(node);

            return node;
        }
    }
}
