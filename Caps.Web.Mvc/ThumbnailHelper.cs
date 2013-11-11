using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace Caps.Web.Mvc
{
    public static class ThumbnailHelpers
    {
        public static byte[] GetThumbnail(byte[] imageBytes, int? maxWidth, int? maxHeight, out System.Drawing.Size finalSize)
        {
            var settings = new ImageResizer.ResizeSettings(maxWidth.GetValueOrDefault(220), maxHeight.GetValueOrDefault(160),
                ImageResizer.FitMode.Max, null);
            return GetThumbnail(imageBytes, settings, out finalSize);
        }

        public static byte[] GetThumbnail(byte[] imageBytes, ImageResizer.ResizeSettings settings, out System.Drawing.Size finalSize)
        {
            using (System.IO.MemoryStream streamIn = new System.IO.MemoryStream(imageBytes))
            using (System.IO.MemoryStream streamOut = new System.IO.MemoryStream())
            {
                var builder = ImageResizer.ImageBuilder.Current;

                var bitmap = new System.Drawing.Bitmap(streamIn);
                finalSize = builder.GetFinalSize(bitmap.Size, settings);

                streamIn.Position = 0;
                builder.Build(streamIn, streamOut, settings);

                streamOut.Position = 0;
                using (System.IO.BinaryReader reader = new System.IO.BinaryReader(streamOut))
                    return reader.ReadBytes((int)streamOut.Length);
            }
        }

        public static ActionResult Thumbnail(byte[] imageBytes, int? maxWidth, int? maxHeight, String contentType)
        {
            System.Drawing.Size finalSize;
            byte[] previewBytes = GetThumbnail(imageBytes, maxWidth, maxHeight, out finalSize);
            return new FileContentResult(previewBytes, contentType);
        }

        public static DbThumbnail CreateThumbnail(this DbFileVersion fileVersion, int maxWidth, int maxHeight)
        {
            String name = String.Format("{0}x{1}", maxWidth, maxHeight);
            return fileVersion.CreateThumbnail(name, maxWidth, maxHeight);
        }
        public static DbThumbnail CreateThumbnail(this DbFileVersion fileVersion, String thumbnailName, int? maxWidth, int? maxHeight)
        {
            System.Drawing.Size finalSize;
            byte[] previewBytes = GetThumbnail(fileVersion.Content.Data, maxWidth, maxHeight, out finalSize);

            var thumbnail = new DbThumbnail();
            thumbnail.ContentType = fileVersion.File.ContentType;
            thumbnail.Data = previewBytes;
            thumbnail.FileVersionId = fileVersion.Id;
            thumbnail.OriginalFileHash = fileVersion.Hash;
            thumbnail.Name = thumbnailName;
            thumbnail.Width = finalSize.Width;
            thumbnail.Height = finalSize.Height;

            return thumbnail;
        }

        public static DbThumbnail GetOrCreateThumbnail(this DbFileVersion fileVersion, String thumbnailName)
        {
            int maxWidth, maxHeight;
            if (!TryParseDimensions(thumbnailName, out maxWidth, out maxHeight))
            {
                maxWidth = 220;
                maxHeight = 160;
            }
            return fileVersion.GetOrCreateThumbnail(thumbnailName, maxWidth, maxHeight);
        }

        public static DbThumbnail GetOrCreateThumbnail(this DbFileVersion fileVersion, String thumbnailName, int? maxWidth, int? maxHeight)
        {
            var thumbnail = fileVersion.Thumbnails.FirstOrDefault(t => String.Equals(t.Name, thumbnailName, StringComparison.OrdinalIgnoreCase));
            if (thumbnail == null || !thumbnail.OriginalFileHash.SequenceEqual(fileVersion.Hash))
            {
                if (thumbnail != null)
                    fileVersion.Thumbnails.Remove(thumbnail);

                var newThumbnail = fileVersion.CreateThumbnail(thumbnailName, maxWidth, maxHeight);
                fileVersion.Thumbnails.Add(newThumbnail);

                thumbnail = newThumbnail;
            }
            return thumbnail;
        }

        public static System.Drawing.Size GetImageSize(this DbFileVersion fileVersion)
        {
            using (var stream = new MemoryStream(fileVersion.Content.Data))
            using (var bmp = new System.Drawing.Bitmap(stream))
            {
                return bmp.Size;
            }
        }

        static bool TryParseDimensions(String s, out int width, out int height)
        {
            width = 0;
            height = 0;

            if (String.IsNullOrWhiteSpace(s)) 
                return false;

            var match = Regex.Match(s, @"^(?<width>\d{1,4})x(?<height>\d{1,4})$");
            if (match.Success)
            {
                width = int.Parse(match.Groups["width"].Value);
                height = int.Parse(match.Groups["height"].Value);
                return true;
            }
            return false;
        }
    }
}
