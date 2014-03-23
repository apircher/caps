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
        XmlNode TransformNode(XmlNode node, String controlId, String language, DbSiteMapNode siteMapNode, ContentScriptManager scriptManager, IUrlHelper urlHelper);
    }

    public interface IUrlHelper
    {
        String Action(String action, String controller, object routeData);
        String RouteUrl(String routeName, object routeData);
        String Publication(int permanentId);
        String Content(String contentPath);
    }
}
