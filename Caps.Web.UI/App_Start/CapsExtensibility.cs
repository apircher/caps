using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;

namespace Caps.Web.UI
{
    public static class CapsExtensibility
    {
        public static void LoadExtensions()
        {
            LoadThumbnailGenerators();
        }

        static void LoadThumbnailGenerators()
        {
            var basePath = ConfigurationManager.AppSettings["ExtensibilityBasePath"];
            if (String.IsNullOrWhiteSpace(basePath))
                return;
            if (basePath.StartsWith("~")) 
                basePath = HttpContext.Current.Server.MapPath(basePath);

            var thumbnailGeneratorsPath = Path.Combine(basePath, "ThumbnailGenerators\\");
            if (!Directory.Exists(thumbnailGeneratorsPath))
                return;

            var catalog = new DirectoryCatalog(thumbnailGeneratorsPath);
            var container = new CompositionContainer(catalog);

            var nfo = new ThumbnailGeneratorExtensionInfo();
            container.ComposeParts(nfo);
            foreach (var thumbnailGenerator in nfo.ThumbnailGenerators)
                Caps.ImageProcessing.ThumbnailGenerator.RegisterNamedGenerator(thumbnailGenerator.Name, thumbnailGenerator);
        }

        public class ThumbnailGeneratorExtensionInfo
        {
            [ImportMany(typeof(Caps.ImageProcessing.IThumbnailGenerator))]
            public Caps.ImageProcessing.IThumbnailGenerator[] ThumbnailGenerators;
        }
    }
}