using Caps.Data;
using Caps.Data.Model;
using Caps.Data.Utils;
using Caps.Web.Mvc.Sitemap;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Caps.Web.Mvc.Providers
{
    public class CapsSiteMapBuilder : IDisposable
    {
        static String[] supportedNodeTypes = new String[] { "ROOT", "Page", "Action", "Teaser" };

        bool disposed;
        CapsDbContext db;
        Website website;
        DbSiteMap currentSiteMap;
        IList<DbSiteMapNode> nodeList;

        Dictionary<String, SiteMapNode> indexNameToSiteMapNode;
        Dictionary<int, SiteMapNode> indexIdToSiteMapNode;

        public CapsSiteMapBuilder()
        {
            db = DependencyResolver.Current.GetService<CapsDbContext>();
            website = db.Websites.FirstOrDefault();

            if (website != null)
            {
                currentSiteMap = db.GetCurrentSiteMap(website.Id);
                nodeList = currentSiteMap != null && currentSiteMap.SiteMapNodes != null ? 
                    currentSiteMap.SiteMapNodes.ToList() : new List<DbSiteMapNode>();
            }
        }

        ~CapsSiteMapBuilder()
        {
            Dispose(false);
        }

        public CapsSiteMapBuilderResult BuildSitemap(StaticSiteMapProvider provider, Action<System.Web.SiteMapNode, System.Web.SiteMapNode> addNodeAction)
        {
            indexNameToSiteMapNode = new Dictionary<string, SiteMapNode>();
            indexIdToSiteMapNode = new Dictionary<int, SiteMapNode>();

            var rootNode = new CapsSiteMapNode(provider, "root");
            rootNode.Title = "Home";
            rootNode.Url = "~/";

            var rootNodeEntity = nodeList.Where(n => !n.ParentNodeId.HasValue && String.Equals(n.NodeType, "ROOT"))
                .FirstOrDefault();
            if (rootNodeEntity == null)
                return null;

            foreach (var entity in rootNodeEntity.ChildNodes.OrderBy(n => n.Ranking))
                MapNode(entity, provider, rootNode, addNodeAction);

            return new CapsSiteMapBuilderResult
            {
                RootNode = rootNode,
                IndexNameToNode = indexNameToSiteMapNode,
                IndexIdToNode = indexIdToSiteMapNode,
                SiteMapExpiration = GetSiteMapExpiration()
            };
        }

        void MapNode(DbSiteMapNode entity, StaticSiteMapProvider provider, SiteMapNode parentNode, Action<SiteMapNode, SiteMapNode> addNodeAction)
        {
            CapsSiteMapNode siteMapNode = null;

            if (entity.IsNodeTypeIn(supportedNodeTypes))
            {
                String url = GetUrl(entity);
                if (String.IsNullOrWhiteSpace(url))
                    return;

                siteMapNode = new CapsSiteMapNode(provider, entity.Id.ToString("x", CultureInfo.InvariantCulture), GetUrl(entity), entity.Name);
                if (addNodeAction != null)
                    addNodeAction(siteMapNode, parentNode);
                Index(entity, siteMapNode);

                siteMapNode.AddResources(entity.Resources.Select(r =>
                    new Tuple<String, CapsSiteMapNodeResource>(r.Language, new CapsSiteMapNodeResource { Title = r.Title })));
                siteMapNode.NodeType = entity.NodeType;

                if (entity.ChildNodes != null)
                {
                    foreach (var childEntity in entity.ChildNodes.OrderBy(n => n.Ranking))
                        MapNode(childEntity, provider, siteMapNode, addNodeAction);
                }
            }
        }

        String GetUrl(DbSiteMapNode entity)
        {
            RequestContext ctx;
            if (HttpContext.Current.Handler is MvcHandler)
                ctx = ((MvcHandler)HttpContext.Current.Handler).RequestContext;
            else
                ctx = new RequestContext(new HttpContextWrapper(HttpContext.Current), new RouteData());

            UrlHelper helper = new UrlHelper(ctx);
            var routeData = new RouteValueDictionary();
            if (entity.IsNodeTypeIn("Page"))
            {
                routeData.Add("id", entity.PermanentId.ToString("x"));
                routeData.Add("name", entity.Name.UrlEncode());
                routeData.Add("language", CapsSiteMapNode.LanguagePlaceHolder);
                return helper.Action("Index", "CapsContent", routeData);
            }

            if (entity.IsNodeType("Action"))
            {
                var routeValueDict = RouteUtils.GetRouteDataByUrl(entity.ActionUrl);
                var routeValues = routeValueDict.Values;
                if (routeValues.ContainsKey("language")) routeValues["language"] = CapsSiteMapNode.LanguagePlaceHolder;
                VirtualPathData vpd = routeValueDict.Route.GetVirtualPath(new RequestContext(ctx.HttpContext, routeValueDict), routeValues);
                String url = ("~/" + vpd.VirtualPath);
                return VirtualPathUtility.ToAbsolute(url);
            }

            if (entity.IsNodeType("Teaser"))
            {
                int redirectId = int.Parse(entity.Redirect);
                var linkedNode = nodeList.FirstOrDefault(n => n.PermanentId == redirectId);
                if (linkedNode != null)
                    return GetUrl(linkedNode) + String.Format("?ref={0}", entity.Id);
            }

            return helper.Action("Index", "Home", routeData);
        }
        DateTime GetSiteMapExpiration()
        {
            DateTime siteMapExpiration = DateTime.MaxValue;
            var nextSiteMap = db.SiteMaps.Where(m => m.PublishedFrom.HasValue && m.PublishedFrom.Value > DateTime.UtcNow)
                .OrderBy(m => m.Version).FirstOrDefault();
            if (nextSiteMap != null)
                siteMapExpiration = nextSiteMap.PublishedFrom.Value;
            return siteMapExpiration;
        }

        void Index(DbSiteMapNode entity, SiteMapNode node)
        {
            String nameKey = entity.Name.UrlEncode();
            if (!indexNameToSiteMapNode.ContainsKey(nameKey))
                indexNameToSiteMapNode.Add(nameKey, node);

            if (!indexIdToSiteMapNode.ContainsKey(entity.PermanentId))
                indexIdToSiteMapNode.Add(entity.PermanentId, node);
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
                    db = null;
                }
            }
            disposed = true;
        }
    }

    public class CapsSiteMapBuilderResult
    {
        public SiteMapNode RootNode { get; set; }
        public IDictionary<int, SiteMapNode> IndexIdToNode { get; set; }
        public IDictionary<String, SiteMapNode> IndexNameToNode { get; set; }
        public DateTime SiteMapExpiration { get; set; }
    }
}
