using Caps.Consumer.Localization;
using Caps.Consumer.Model;
using Caps.Consumer.Mvc.Utils;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Net.Http;
using System.Configuration;

namespace Caps.Consumer.Mvc.SiteMap
{
    public class DefaultSiteMapBuilder : ISiteMapBuilder
    {
        static String[] supportedNodeTypes = new String[] { "ROOT", "Page", "Action", "Teaser", "CONTAINER", "SUB_NAV_CONTAINER" };

        bool disposed;
        Website website;
        DbSiteMap currentSiteMap;
        IList<DbSiteMapNode> nodeList;

        Dictionary<String, SiteMapNode> indexNameToSiteMapNode;
        Dictionary<int, SiteMapNode> indexIdToSiteMapNode;
        Dictionary<String, SiteMapNode> indexUrlToSiteMapNode;

        public DefaultSiteMapBuilder()
        {
        }
        ~DefaultSiteMapBuilder()
        {
            Dispose(false);
        }

        public CapsSiteMapBuilderResult BuildSiteMap(StaticSiteMapProvider provider, Action<System.Web.SiteMapNode, System.Web.SiteMapNode> addNodeAction)
        {
            var result = AsyncInline.Run<CapsSiteMapBuilderResult>(() => BuildSiteMapAsync(provider, addNodeAction));
            return result;
        }

        public async Task<CapsSiteMapBuilderResult> BuildSiteMapAsync(StaticSiteMapProvider provider, Action<System.Web.SiteMapNode, System.Web.SiteMapNode> addNodeAction)
        {
            indexNameToSiteMapNode = new Dictionary<string, SiteMapNode>();
            indexIdToSiteMapNode = new Dictionary<int, SiteMapNode>();
            indexUrlToSiteMapNode = new Dictionary<string, SiteMapNode>();

            CapsHttpClient client = new CapsHttpClient(new Uri(ConfigurationManager.AppSettings["caps:Url"]), 
                ConfigurationManager.AppSettings["caps:AppKey"], 
                ConfigurationManager.AppSettings["caps:AppSecret"]);

            // Get Websites
            var websites = await client.GetWebsites();
            if (websites == null || websites.Length == 0)
                throw new Exception("Unable to load websites.");

            website = websites.First();
            currentSiteMap = await client.GetCurrentSiteMap(website.Id);
            nodeList = currentSiteMap != null && currentSiteMap.SiteMapNodes != null ?
                currentSiteMap.SelectAllSiteMapNodes().ToList() : new List<DbSiteMapNode>();

            var rootNodeEntity = nodeList.Where(n => !n.ParentNodeId.HasValue && String.Equals(n.NodeType, "ROOT"))
                .FirstOrDefault();
            if (rootNodeEntity == null)
                return null;

            var rootNode = new CapsSiteMapNode(provider, "root");
            rootNode.Title = rootNodeEntity.Name;
            rootNode.Url = Url.LocalizeAction("Index", "Home", CapsSiteMapNode.LanguagePlaceHolder);
            rootNode.PermanentId = rootNodeEntity.PermanentId;
            rootNode.Entity = rootNodeEntity;
            rootNode.Name = rootNodeEntity.Name.UrlEncode();
            rootNode.ContentVersion = rootNodeEntity.Content != null ? rootNodeEntity.Content.ContentVersion : 0;
            rootNode.AddResources(rootNodeEntity.Resources.Select(r =>
                new Tuple<String, CapsSiteMapNodeResource>(r.Language, new CapsSiteMapNodeResource { Title = r.Title, MetaKeywords = r.Keywords, MetaDescription = r.Description })));
            indexUrlToSiteMapNode.Add(rootNode.Url, rootNode);

            foreach (var entity in rootNodeEntity.ChildNodes.OrderBy(n => n.Ranking))
                TryMapNode(entity, provider, rootNode, addNodeAction);

            return new CapsSiteMapBuilderResult
            {
                RootNode = rootNode,
                IndexNameToNode = indexNameToSiteMapNode,
                IndexIdToNode = indexIdToSiteMapNode,
                SiteMapExpiration = GetSiteMapExpiration()
            };
        }

        bool TryMapNode(DbSiteMapNode entity, StaticSiteMapProvider provider, SiteMapNode parentNode, Action<SiteMapNode, SiteMapNode> addNodeAction)
        {
            try
            {
                MapNode(entity, provider, parentNode, addNodeAction);
                return true;
            }
            catch (Exception)
            {
                //TODO: Log Exception
                return false;
            }
        }
        void MapNode(DbSiteMapNode entity, StaticSiteMapProvider provider, SiteMapNode parentNode, Action<SiteMapNode, SiteMapNode> addNodeAction)
        {
            CapsSiteMapNode siteMapNode = null;

            if (entity != null && IsSupportedNodeType(entity.NodeType))
            {
                String url = GetUrl(entity);
                if (String.IsNullOrWhiteSpace(url))
                    return;

                siteMapNode = CreateNode(provider, entity, entity.Id.ToString("x", CultureInfo.InvariantCulture), url, entity.Name);
                siteMapNode.PermanentId = entity.PermanentId;
                siteMapNode.Entity = entity;
                siteMapNode.Name = entity.Name.UrlEncode();
                siteMapNode.ContentVersion = entity.Content != null ? entity.Content.ContentVersion : 0;

                if (indexUrlToSiteMapNode.ContainsKey(siteMapNode.Url))
                    return;

                if (addNodeAction != null)
                    addNodeAction(siteMapNode, parentNode);
                Index(entity, siteMapNode);

                siteMapNode.AddResources(entity.Resources.Select(r =>
                    new Tuple<String, CapsSiteMapNodeResource>(r.Language, new CapsSiteMapNodeResource { Title = r.Title, MetaKeywords = r.Keywords, MetaDescription = r.Description })));
                siteMapNode.NodeType = entity.NodeType;

                if (entity.ChildNodes != null)
                {
                    foreach (var childEntity in entity.ChildNodes.OrderBy(n => n.Ranking))
                        TryMapNode(childEntity, provider, siteMapNode, addNodeAction);
                }
            }
        }

        protected virtual CapsSiteMapNode CreateNode(StaticSiteMapProvider provider, DbSiteMapNode entity, String key, String url, String title)
        {
            return new CapsSiteMapNode(provider, key, url, title);
        }
        protected virtual bool IsSupportedNodeType(String nodeType)
        {
            return supportedNodeTypes.Any(nt => String.Equals(nodeType, nt, StringComparison.OrdinalIgnoreCase));
        }
        protected virtual String GetUrl(DbSiteMapNode entity)
        {
            var routeData = new RouteValueDictionary();
            if (entity.IsNodeTypeIn("ROOT"))
            {
                return Url.Action("Index", "Home", routeData);
            }

            if (entity.IsNodeType("Action"))
            {
                var routeValueDict = RouteUtils.GetRouteDataByUrl(entity.ActionUrl);
                var routeValues = routeValueDict.Values;
                if (routeValues.ContainsKey("language")) routeValues["language"] = CapsSiteMapNode.LanguagePlaceHolder;
                VirtualPathData vpd = routeValueDict.Route.GetVirtualPath(new RequestContext(RequestContext.HttpContext, routeValueDict), routeValues);
                String url = ("~/" + vpd.VirtualPath);
                return VirtualPathUtility.ToAbsolute(url);
            }

            if (entity.IsNodeType("Teaser") && !String.IsNullOrWhiteSpace(entity.Redirect))
            {
                int redirectId = int.Parse(entity.Redirect);
                var linkedNode = nodeList.FirstOrDefault(n => n.PermanentId == redirectId);
                if (linkedNode != null)
                    return GetUrl(linkedNode) + String.Format("?ref={0}", entity.Id);
            }

            routeData.Add("id", entity.PermanentId.ToString("x"));
            routeData.Add("name", CapsSiteMapNode.LocalizedNamePlaceHolder);
            routeData.Add("language", CapsSiteMapNode.LanguagePlaceHolder);
            return Url.Action("Index", "Caps", routeData);
        }
        protected virtual DateTime GetSiteMapExpiration()
        {
            //DateTime siteMapExpiration = DateTime.MaxValue;
            //var nextSiteMap = db.SiteMaps.Where(m => m.PublishedFrom.HasValue && m.PublishedFrom.Value > DateTime.UtcNow)
            //    .OrderBy(m => m.Version).FirstOrDefault();
            //if (nextSiteMap != null)
            //    siteMapExpiration = nextSiteMap.PublishedFrom.Value;
            //return siteMapExpiration;

            return DateTime.Now.Add(TimeSpan.FromMinutes(10));
        }

        /// <summary>
        /// Returns the DbSiteMapNode-Instance with the given 
        /// DbSiteMapNode.Id-Property from the node list last fetched from the server.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        protected DbSiteMapNode FindNodeById(int id)
        {
            return nodeList.FirstOrDefault(n => n.Id == id);
        }

        void Index(DbSiteMapNode entity, SiteMapNode node)
        {
            String nameKey = entity.Name.UrlEncode();
            if (!indexNameToSiteMapNode.ContainsKey(nameKey))
                indexNameToSiteMapNode.Add(nameKey, node);

            if (!indexIdToSiteMapNode.ContainsKey(entity.PermanentId))
                indexIdToSiteMapNode.Add(entity.PermanentId, node);

            if (!indexUrlToSiteMapNode.ContainsKey(node.Url))
                indexUrlToSiteMapNode.Add(node.Url, node);
        }

        UrlHelper urlHelper;
        protected UrlHelper Url
        {
            get
            {
                if (urlHelper == null) urlHelper = new UrlHelper(RequestContext);
                return urlHelper;
            }
        }

        RequestContext requestContext;
        RequestContext RequestContext
        {
            get
            {
                if (requestContext == null)
                {
                    if (HttpContext.Current.Handler is MvcHandler)
                        requestContext = ((MvcHandler)HttpContext.Current.Handler).RequestContext;
                    else
                        requestContext = new RequestContext(new HttpContextWrapper(HttpContext.Current), new RouteData());
                }
                return requestContext;
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
        protected virtual void Dispose(bool disposing)
        {
            if (!disposed)
            {
                if (disposing)
                {
                }
            }
            disposed = true;
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
