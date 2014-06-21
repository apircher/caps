using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.ImageProcessing
{
    public static class BitmapExtensions
    {
        public static Bitmap GetArgbCopy(this Bitmap sourceImage, int width, int height, Color backgroundColor)
        {
            Bitmap bmpNew = new Bitmap(width, height, PixelFormat.Format32bppArgb);

            using (Graphics graphics = Graphics.FromImage(bmpNew))
            {
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.CompositingMode = CompositingMode.SourceOver;
                graphics.InterpolationMode = InterpolationMode.HighQualityBilinear;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.SmoothingMode = SmoothingMode.HighQuality;

                graphics.Clear(backgroundColor);
                graphics.DrawImage(sourceImage, new Rectangle(0, 0, bmpNew.Width, bmpNew.Height), new Rectangle(0, 0, sourceImage.Width, sourceImage.Height), System.Drawing.GraphicsUnit.Pixel);
                graphics.Flush();
            }

            return bmpNew;
        }

        public static byte[] SaveImage(this Image image, ImageFormat imageFormat)
        {
            var streamOut = new MemoryStream();
            if (imageFormat == ImageFormat.Jpeg)
            {
                var jpgEncoder = GetEncoder(imageFormat);
                var myEncoder = System.Drawing.Imaging.Encoder.Quality;
                var encoderParameters = new EncoderParameters(1);
                encoderParameters.Param[0] = new EncoderParameter(myEncoder, 100L);
                image.Save(streamOut, jpgEncoder, encoderParameters);
            }
            else
                image.Save(streamOut, imageFormat);

            byte[] result;
            streamOut.Position = 0;
            using (BinaryReader reader = new BinaryReader(streamOut))
                result = reader.ReadBytes((int)streamOut.Length);

            return result;
        }

        static ImageCodecInfo GetEncoder(ImageFormat format)
        {
            return ImageCodecInfo.GetImageDecoders()
                .FirstOrDefault(c => c.FormatID == format.Guid);
        }
    }
}
