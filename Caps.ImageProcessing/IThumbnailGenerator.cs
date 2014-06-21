using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.ImageProcessing
{
    public interface IThumbnailGenerator
    {
        String Name { get;  }
        ThumbnailGeneratorResult GenerateThumbnail(byte[] sourceImage, ThumbnailSettings settings);
    }
}
