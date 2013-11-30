using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Web.Mvc.Imaging
{
    public abstract class ThumbnailGenerator : IThumbnailGenerator
    {
        /// <summary>
        /// Generates a thumbnail for the given source image.
        /// </summary>
        /// <param name="sourceImage"></param>
        /// <param name="boxWidth"></param>
        /// <param name="boxHeight"></param>
        /// <returns></returns>
        public abstract ThumbnailGeneratorResult GenerateThumbnail(byte[] sourceImage, int boxWidth, int boxHeight);
                
        /// <summary>
        /// Registers a named thumbnail generator.
        /// </summary>
        /// <param name="name"></param>
        /// <param name="generator"></param>
        public static void RegisterNamedGenerator(String name, IThumbnailGenerator generator)
        {
            if (String.IsNullOrWhiteSpace(name))
                throw new InvalidOperationException("The parameter \"name\" must not be null or empty.");

            if (thumbnailGenerators.ContainsKey(name))
                thumbnailGenerators[name] = generator;
            else
                thumbnailGenerators.Add(name, generator);
        }
        /// <summary>
        /// A dictionary of named thumbnail generators.
        /// </summary>
        static Dictionary<String, IThumbnailGenerator> thumbnailGenerators = new Dictionary<String, IThumbnailGenerator>
        {
            { String.Empty, new DefaultThumbnailGenerator() }
        };
        /// <summary>
        /// Searches for a thumbnail generator with the given name and returns it.
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        public static IThumbnailGenerator GetNamedGenerator(String name)
        {
            if (!String.IsNullOrWhiteSpace(name))
            {
                if (thumbnailGenerators.ContainsKey(name))
                    return thumbnailGenerators[name];
            }
            return thumbnailGenerators[String.Empty];
        }
    }

    public class ThumbnailGeneratorResult
    {
        public byte[] Data { get; set; }
        public Size FinalSize { get; set; }
    }
}
