using ImageResizer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc.Imaging
{
    public class DefaultThumbnailGenerator : ThumbnailGenerator
    {
        public override ThumbnailGeneratorResult GenerateThumbnail(byte[] sourceImage, int boxWidth, int boxHeight)
        {
            var settings = new ImageResizer.ResizeSettings(boxWidth, boxHeight, FitMode.Max, null);
            return CreateImageResizerThumbnail(sourceImage, settings);
        }

        ThumbnailGeneratorResult CreateImageResizerThumbnail(byte[] imageBytes, ResizeSettings settings) 
        {
            using (MemoryStream streamIn = new MemoryStream(imageBytes))
            using (MemoryStream streamOut = new MemoryStream())
            {
                var builder = ImageResizer.ImageBuilder.Current;
                var bitmap = new System.Drawing.Bitmap(streamIn);
                var finalSize = builder.GetFinalSize(bitmap.Size, settings);

                streamIn.Position = 0;
                builder.Build(streamIn, streamOut, settings);

                streamOut.Position = 0;
                using (System.IO.BinaryReader reader = new System.IO.BinaryReader(streamOut))
                    return new ThumbnailGeneratorResult
                    {
                        Data = reader.ReadBytes((int)streamOut.Length),
                        FinalSize = finalSize
                    };
            }
        }
    }
}
