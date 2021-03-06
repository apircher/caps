﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.ImageProcessing
{
    public enum ThumbnailFitMode
    {
        Default = 0,
        Max,
        Crop,
        Pad
    }

    public enum ThumbnailScaleMode
    {
        Default = 0,
        Both,
        DownscaleOnly,
        UpscaleOnly,
        UpscaleCanvas
    }

    public class ThumbnailSettings
    {
        public int Width { get; set; }
        public int Height { get; set; }
        public ThumbnailFitMode FitMode { get; set; }
        public ThumbnailScaleMode ScaleMode { get; set; }
    }
}
