using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer
{
    public static class CapsConfiguration
    {
        public static Func<Caps.Consumer.ContentControls.ContentControlRegistry> ContentControlRegistryFactory
            = () => new Caps.Consumer.ContentControls.ContentControlRegistry();
    }
}
