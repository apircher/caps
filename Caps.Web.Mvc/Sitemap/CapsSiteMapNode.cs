using Caps.Data.Localization;
using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc.Sitemap
{
    public class CapsSiteMapNode : System.Web.SiteMapNode
    {
        public const String LanguagePlaceHolder = "--language--";

        String nodeType;
        Dictionary<String, CapsSiteMapNodeResource> resources = new Dictionary<string, CapsSiteMapNodeResource>();

        public CapsSiteMapNode(System.Web.SiteMapProvider provider, String key)
            : base(provider, key)
        {
        }
        public CapsSiteMapNode(System.Web.SiteMapProvider provider, String key, String url)
            : base(provider, key, url)
        {
        }
        public CapsSiteMapNode(System.Web.SiteMapProvider provider, String key, String url, String title)
            : base(provider, key, url, title)
        {
        }
        public CapsSiteMapNode(System.Web.SiteMapProvider provider, String key, String url, String title, String description)
            : base(provider, key, url, title, description)
        {
        }

        public String NodeType
        {
            set
            {
                nodeType = value;
            }
            get
            {
                return nodeType;
            }
        }
        public DbSiteMapNode Entity { get; set; }
        public int PermanentId { get; set; }

        public override string Title
        {
            get
            {
                return GetLocalizedValue<CapsSiteMapNodeResource, String>(Language.CurrentLanguage, r => r.Title, base.Title);
            }
            set
            {
                base.Title = value;
            }
        }
        public override string Url
        {
            get
            {
                var language = Language.CurrentLanguage;
                var provider = this.Provider as Caps.Web.Mvc.Providers.CapsSitemapProvider;
                if (provider != null && provider.IsBuildingSiteMap)
                    language = Language.DefaultLanguage;
                return base.Url.Replace(LanguagePlaceHolder, language);
            }
            set
            {
                base.Url = value;
            }
        }
        public String Name { get; set; }

        public CapsSiteMapNodeResource ResourceForLanguage(String language)
        {
            String lang = language.ToUpperInvariant();
            if (!resources.ContainsKey(lang))
                resources.Add(lang, new CapsSiteMapNodeResource());
            return resources[lang];
        }
        public CapsSiteMapNodeResource CurrentResource
        {
            get
            {
                return ResourceForLanguage(Language.CurrentLanguage);
            }
        }
        public void AddResources(IEnumerable<Tuple<String, CapsSiteMapNodeResource>> res)
        {
            foreach (var resource in res)
            {
                String lang = resource.Item1.ToUpperInvariant();
                if (resources.ContainsKey(lang))
                    resources[lang] = resource.Item2;
                else
                    resources.Add(lang, resource.Item2);
            }
        }

        public bool IsNodeType(String nodeType)
        {
            return String.Equals(NodeType, nodeType, StringComparison.OrdinalIgnoreCase);
        }
        public bool IsNodeTypeIn(params String[] nodeTypes)
        {
            return nodeTypes.Any(t => IsNodeType(t));
        }

        public bool IsOrContainsCurrentNode()
        {
            return IsOrContainsCurrentNode(Provider);
        }
        public bool IsOrContainsCurrentNode(System.Web.SiteMapProvider provider)
        {
            if (provider == null)
                throw new ArgumentNullException("provider");

            var currentNode = provider.CurrentNode;
            if (currentNode == null)
                return false;

            return IsOrContainsNode(this, currentNode);
        }
        static bool IsOrContainsNode(System.Web.SiteMapNode thisNode, System.Web.SiteMapNode node)
        {
            if (thisNode == null)
                throw new ArgumentNullException("thisNode");
            if (node == null)
                throw new ArgumentNullException("node");

            return String.Equals(thisNode.Url, node.Url, StringComparison.OrdinalIgnoreCase) ||
                thisNode.ChildNodes.Cast<System.Web.SiteMapNode>().Any(n => IsOrContainsNode(n, node));
        }

        TReturnValue GetLocalizedValue<TResource, TReturnValue>(String language, Func<TResource, TReturnValue> expression, TReturnValue defaultValue)
            where TResource : CapsSiteMapNodeResource
        {
            TReturnValue result = expression((TResource)ResourceForLanguage(language));
            return HasValue(result) ? result : defaultValue;
        }
        bool HasValue<T>(T value)
        {
            var t = typeof(T);
            if (t == typeof(String))
                return !String.IsNullOrWhiteSpace(value as String);

            return value != null;
        }
    }

    public class CapsSiteMapNodeResource
    {
        public String Title { get; set; }
    }
}
