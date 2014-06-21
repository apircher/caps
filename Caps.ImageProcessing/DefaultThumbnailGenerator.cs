using ImageResizer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.ImageProcessing
{
    public class DefaultThumbnailGenerator : ThumbnailGenerator
    {
        const String generatorName = "Default";
        
        public override string Name
        {
            get { return generatorName; }
        }

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
            rs.Scale = ConvertToScaleMode(settings.ScaleMode);
            return rs;
        }

        ImageResizer.FitMode ConvertToFitMode(ThumbnailFitMode mode)
        {
            switch (mode)
            {
                case ThumbnailFitMode.Max:
                    return FitMode.Max;
                case ThumbnailFitMode.Pad:
                    return FitMode.Pad;
                default:
                    return FitMode.Crop;
            }
        }

        ImageResizer.ScaleMode ConvertToScaleMode(ThumbnailScaleMode mode)
        {
            switch (mode)
            {
                case ThumbnailScaleMode.UpscaleCanvas:
                    return ScaleMode.UpscaleCanvas;
                case ThumbnailScaleMode.UpscaleOnly:
                    return ScaleMode.UpscaleOnly;
                case ThumbnailScaleMode.Both:
                    return ScaleMode.Both;
                default:
                    return ScaleMode.DownscaleOnly;
            }
        }
    }
}
