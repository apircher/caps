using Caps.Consumer.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Consumer.ContentControls
{
    public interface IContentControl
    {
        XmlNode TransformNode(ControlContext context);
    }

    public interface IUrlHelper
    {
        String Action(String action, String controller, object routeData);
        String RouteUrl(String routeName, object routeData);
        String Publication(int permanentId);
        String Content(String contentPath);
    }
    
    public class ControlContext
    {
        public XmlNode Node { get; set; }
        public XmlDocument Document
        {
            get
            {
                if (Node == null) return null;
                return Node.OwnerDocument;
            }
        }

        public String ControlId { get; set; }
        public String Language { get; set; }
        public DbSiteMapNode SiteMapNode { get; set; }
        public ContentScriptManager ScriptManager { get; set; }
        public IUrlHelper UrlHelper { get; set; }
    }
}
