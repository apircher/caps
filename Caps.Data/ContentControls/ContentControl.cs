using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Data.ContentControls
{
    public class ContentControl : IContentControl
    {
        public XmlNode TransformNode(XmlNode node, String controlId, String language, DbSiteMapNode siteMapNode, ContentScriptManager scriptManager, IUrlHelper urlHelper)
        {
            return OnTransformNode(node, controlId, language, siteMapNode, scriptManager, urlHelper);
        }

        protected virtual XmlNode OnTransformNode(XmlNode node, String controlId, String language, DbSiteMapNode siteMapNode, ContentScriptManager scriptManager, IUrlHelper urlHelper)
        {
            return node.OwnerDocument.CreateDiv(controlId, "caps-control");
        }
    }
}
