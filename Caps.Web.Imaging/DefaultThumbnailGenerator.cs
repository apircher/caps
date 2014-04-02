using ImageResizer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Imaging
{
    public class DefaultThumbnailGenerator : ThumbnailGenerator
    {
        public override ThumbnailGeneratorResult GenerateThumbnail(byte[] sourceImage, ThumbnailSettings settings)
        {
            return CreateImageResizerThumbnail(sourceImage, CreateResizeSettings(settings));
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

        ImageResizer.ResizeSettings CreateResizeSettings(ThumbnailSettings settings)
        {
            var rs = new ImageResizer.ResizeSettings(settings.Width, settings.Height, ConvertToFitMode(settings.FitMode), null);
            rs.Scale = ScaleMode.UpscaleCanvas;
            return rs;
        }

        ImageResizer.FitMode ConvertToFitMode(ThumbnailFitMode mode)
        {
            switch (mode)
            {
                case ThumbnailFitMode.Max:
                    return FitMode.Max;
                default:
                    return FitMode.Crop;
            }
        }
    }
}
