using Caps.Consumer.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Consumer.ContentControls
{
    public class ContentControl : IContentControl
    {
        public XmlNode TransformNode(ControlContext context)
        {
            return OnTransformNode(context);
        }

        protected virtual XmlNode OnTransformNode(ControlContext context)
        {
            return context.Node.OwnerDocument.CreateDiv(context.ControlId, "caps-control");
        }
    }
}
