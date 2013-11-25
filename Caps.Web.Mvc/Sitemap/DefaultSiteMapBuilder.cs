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

namespace Caps.Web.Mvc.Sitemap
{
    public class DefaultSiteMapBuilder : ISiteMapBuilder
    {
        static String[] supportedNodeTypes = new String[] { "ROOT", "Page", "Action", "Teaser" };

        bool disposed;
        CapsDbContext db;
        Website website;
        DbSiteMap currentSiteMap;
        IList<DbSiteMapNode> nodeList;

        Dictionary<String, SiteMapNode> indexNameToSiteMapNode;
        Dictionary<int, SiteMapNode> indexIdToSiteMapNode;

        public DefaultSiteMapBuilder(CapsDbContext db)
        {
            this.db = db;
            website = db.Websites.FirstOrDefault();

            if (website != null)
            {
                currentSiteMap = LoadSiteMapData(website);
                nodeList = currentSiteMap != null && currentSiteMap.SiteMapNodes != null ? 
                    currentSiteMap.SiteMapNodes.ToList() : new List<DbSiteMapNode>();
            }
        }
        ~DefaultSiteMapBuilder()
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

            if (entity != null && IsSupportedNodeType(entity.NodeType))
            {
                String url = GetUrl(entity);
                if (String.IsNullOrWhiteSpace(url))
                    return;

                siteMapNode = CreateNode(provider, entity, entity.Id.ToString("x", CultureInfo.InvariantCulture), GetUrl(entity), entity.Name);
                siteMapNode.PermanentId = entity.PermanentId;
                siteMapNode.Entity = entity;
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
            if (entity.IsNodeTypeIn("Page"))
            {
                routeData.Add("id", entity.PermanentId.ToString("x"));
                routeData.Add("name", entity.Name.UrlEncode());
                routeData.Add("language", CapsSiteMapNode.LanguagePlaceHolder);
                return Url.Action("Index", "CapsContent", routeData);
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

            if (entity.IsNodeType("Teaser"))
            {
                int redirectId = int.Parse(entity.Redirect);
                var linkedNode = nodeList.FirstOrDefault(n => n.PermanentId == redirectId);
                if (linkedNode != null)
                    return GetUrl(linkedNode) + String.Format("?ref={0}", entity.Id);
            }

            return Url.Action("Index", "Home", routeData);
        }
        protected virtual DateTime GetSiteMapExpiration() 
        {
            DateTime siteMapExpiration = DateTime.MaxValue;
            var nextSiteMap = db.SiteMaps.Where(m => m.PublishedFrom.HasValue && m.PublishedFrom.Value > DateTime.UtcNow)
                .OrderBy(m => m.Version).FirstOrDefault();
            if (nextSiteMap != null)
                siteMapExpiration = nextSiteMap.PublishedFrom.Value;
            return siteMapExpiration;
        }
        protected virtual System.Data.Entity.Infrastructure.DbQuery<DbSiteMap> IncludeRelatedEntities(System.Data.Entity.Infrastructure.DbQuery<DbSiteMap> sitemaps)
        {
            return sitemaps.Include("SiteMapNodes").Include("SiteMapNodes.Resources");
        }

        void Index(DbSiteMapNode entity, SiteMapNode node)
        {
            String nameKey = entity.Name.UrlEncode();
            if (!indexNameToSiteMapNode.ContainsKey(nameKey))
                indexNameToSiteMapNode.Add(nameKey, node);

            if (!indexIdToSiteMapNode.ContainsKey(entity.PermanentId))
                indexIdToSiteMapNode.Add(entity.PermanentId, node);
        }
        DbSiteMap LoadSiteMapData(Website website)
        {
            return IncludeRelatedEntities(db.SiteMaps)
                .Where(m => m.PublishedFrom.HasValue && m.PublishedFrom.Value <= DateTime.UtcNow)
                .OrderByDescending(m => m.Version).ThenByDescending(m => m.PublishedFrom)
                .FirstOrDefault();
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
                    db = null;
                }
            }
            disposed = true;
        }
    }
}
