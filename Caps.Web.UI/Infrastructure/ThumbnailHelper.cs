using Caps.Data.Model;
using Caps.Web.Imaging;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Mvc;

namespace Caps.Web.UI.Infrastructure
{
    public static class ThumbnailHelpers
    {
        public static DbThumbnail CreateThumbnail(this DbFileVersion fileVersion, int maxWidth, int maxHeight, ThumbnailFitMode fitMode = ThumbnailFitMode.Default)
        {
            String name = String.Format("{0}x{1}", maxWidth, maxHeight);
            return fileVersion.CreateThumbnail(name, maxWidth, maxHeight, fitMode);
        }
        public static DbThumbnail CreateThumbnail(this DbFileVersion fileVersion, String thumbnailName, int? maxWidth, int? maxHeight, ThumbnailFitMode fitMode)
        {
            var t = GetThumbnail(fileVersion.Content.Data, maxWidth, maxHeight, fitMode, thumbnailName);
            var thumbnail = new DbThumbnail();
            thumbnail.ContentType = fileVersion.File.ContentType;
            thumbnail.Data = t.Data;
            thumbnail.FileVersionId = fileVersion.Id;
            thumbnail.OriginalFileHash = fileVersion.Hash;
            thumbnail.Name = thumbnailName;
            thumbnail.Width = t.FinalSize.Width;
            thumbnail.Height = t.FinalSize.Height;
            return thumbnail;
        }

        public static DbThumbnail GetOrCreateThumbnail(this DbFileVersion fileVersion, String thumbnailName, ThumbnailFitMode fitMode)
        {
            int maxWidth, maxHeight;
            if (!TryParseDimensions(thumbnailName, out maxWidth, out maxHeight))
            {
                maxWidth = 220;
                maxHeight = 160;
            }
            else
                thumbnailName += "_" + fitMode.ToString();
            
            return fileVersion.GetOrCreateThumbnail(thumbnailName, maxWidth, maxHeight, fitMode);
        }
        public static DbThumbnail GetOrCreateThumbnail(this DbFileVersion fileVersion, String thumbnailName, int? maxWidth, int? maxHeight, ThumbnailFitMode fitMode)
        {
            var thumbnail = fileVersion.Thumbnails.FirstOrDefault(t => String.Equals(t.Name, thumbnailName, StringComparison.OrdinalIgnoreCase));
            if (thumbnail == null || !thumbnail.OriginalFileHash.SequenceEqual(fileVersion.Hash))
            {
                if (thumbnail != null)
                    fileVersion.Thumbnails.Remove(thumbnail);

                var newThumbnail = fileVersion.CreateThumbnail(thumbnailName, maxWidth, maxHeight, fitMode);
                fileVersion.Thumbnails.Add(newThumbnail);

                thumbnail = newThumbnail;
            }
            return thumbnail;
        }

        public static ActionResult Thumbnail(byte[] imageBytes, int? maxWidth, int? maxHeight, String contentType)
        {
            var thumbnail = GetThumbnail(imageBytes, maxWidth, maxHeight);
            return new FileContentResult(thumbnail.Data, contentType);
        }

        public static Size GetImageSize(this DbFileVersion fileVersion)
        {
            return GetImageSize(fileVersion.Content.Data);
        }
        public static Size GetImageSize(byte[] imageBytes)
        {
            using (var stream = new MemoryStream(imageBytes))
            using (var bmp = new Bitmap(stream))
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

            var match = Regex.Match(s, @"^(?<width>-?\d{1,4})x(?<height>-?\d{1,4})$");
            if (match.Success)
            {
                width = int.Parse(match.Groups["width"].Value);
                height = int.Parse(match.Groups["height"].Value);
                return true;
            }
            return false;
        }
        static ThumbnailGeneratorResult GetThumbnail(byte[] imageBytes, int? maxWidth, int? maxHeight, ThumbnailFitMode fitMode = ThumbnailFitMode.Default, String generatorName = null)
        {
            var generator = ThumbnailGenerator.GetNamedGenerator(generatorName);
            var settings = new ThumbnailSettings
            {
                Width = maxWidth.GetValueOrDefault(220),
                Height = maxHeight.GetValueOrDefault(160),
                FitMode = fitMode
            };
            return generator.GenerateThumbnail(imageBytes, settings);
        }

        static ThumbnailFitMode ConvertToFitMode(String s)
        {
            ThumbnailFitMode mode = ThumbnailFitMode.Default;
            if (Enum.TryParse<ThumbnailFitMode>(s, out mode))
                return mode;
            return ThumbnailFitMode.Default;
        }

    }
}