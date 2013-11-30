using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc.Imaging
{
    public interface IThumbnailGenerator
    {
        ThumbnailGeneratorResult GenerateThumbnail(byte[] sourceImage, int boxWidth, int boxHeight);
    }
}
