using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.ContentControls
{
    public class ContentControlRegistry
    {
        Dictionary<String, IContentControl> controls;

        public ContentControlRegistry()
        {
            controls = new Dictionary<String, IContentControl>();
        }

        public void RegisterControl(String tagName, IContentControl control)
        {
            String loweredTagName = tagName.ToLowerInvariant();
            if (controls.ContainsKey(loweredTagName))
                controls[loweredTagName] = control;
            else
                controls.Add(loweredTagName, control);
        }

        public IContentControl FindControl(String tagName)
        {
            String loweredTagName = tagName.ToLowerInvariant();
            if (controls.ContainsKey(loweredTagName))
                return controls[loweredTagName];
            return null;
        }
    }
}
