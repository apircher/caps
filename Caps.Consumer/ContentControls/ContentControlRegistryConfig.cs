using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.ContentControls
{
    public static class ContentControlRegistryConfig
    {
        public static void RegisterDefaultControls(ContentControlRegistry registry)
        {
            registry.RegisterControl("slideshow", new Slideshow());
        }
    }
}
