using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Imaging
{
    public enum ThumbnailFitMode
    {
        Default = 0,
        Max,
        Crop
    }

    public class ThumbnailSettings
    {
        public int Width { get; set; }
        public int Height { get; set; }
        public ThumbnailFitMode FitMode { get; set; }
    }
}
