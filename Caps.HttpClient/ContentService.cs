using Caps.Consumer.ContentControls;
using Caps.Consumer.Localization;
using Caps.Consumer.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;

namespace Caps.Consumer
{
    public class ContentService
    {
        CapsHttpClient client;

        public ContentService(CapsHttpClient client)
        {
            this.client = client;
        }

        /// <summary>
        /// Returns the currently published version of the sitemap 
        /// node with the given permanent id.
        /// </summary>
        /// <param name="permanentId"></param>
        /// <returns></returns>
        public async Task<DbSiteMapNode> GetCurrentNodeVersion(int websiteId, int permanentId)
        {
            var response = await client.GetAsync("api/websites/" + websiteId.ToString() + "/content/" + permanentId.ToString());
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadAsAsync<DbSiteMapNode>();
            return null;
        }


        /// <summary>
        /// Returns a localized ContentModel-Instance for the sitemap node with the given 
        /// permanent id and the language set by Caps.Data.Localization.Language.CurrentLanguage.
        /// </summary>
        /// <param name="permanentId"></param>
        /// <returns></returns>
        public async Task<ContentModel> GetContent(int websiteId, int permanentId, ContentScriptManager scriptManager = null)
        {
            var entity = await GetCurrentNodeVersion(websiteId, permanentId);
            if (entity == null)
                throw new ContentNotFoundException();

            var contentParts = entity.Content != null ? entity.Content.ContentParts.Select(p =>
                p.GetValueForLanguage(Language.CurrentLanguage, r =>
                {
                    if (String.IsNullOrWhiteSpace(r.Content))
                        return null;

                    return new ContentPartModel
                    {
                        Content = r.Content,
                        Language = r.Language,
                        Usage = p.Name,
                        IsFallback = !String.Equals(Language.CurrentLanguage, r.Language, StringComparison.OrdinalIgnoreCase)
                    };
                }
                , null, "de", "en")) : new List<ContentPartModel>();

            var contentFiles = entity.Content != null ? entity.Content.Files.Select(f =>
                f.GetValueForLanguage(Language.CurrentLanguage, r => new ContentFileModel
                {
                    Name = f.Name,
                    Language = r.Language,
                    Determination = f.Determination,
                    Group = f.Group,
                    Ranking = f.Ranking,
                    Title = LocalizedFileTitle(f, r.Language),
                    Description = r.Description,
                    FileVersionId = r.DbFileVersionId.GetValueOrDefault(),
                    FileName = r.FileVersion != null ? r.FileVersion.File.FileName : String.Empty,
                    FileSize = r.FileVersion != null ? r.FileVersion.FileSize : 0
                }
                , null, "de", "en")) : new List<ContentFileModel>();

            var result = new ContentModel(scriptManager ?? new ContentScriptManager())
            {
                SiteMapNode = entity,
                ContentParts = contentParts.Where(c => c != null),
                ContentFiles = contentFiles.Where(f => f != null)
            };

            return result;
        }

        String LocalizedFileTitle(PublicationFile f, String language)
        {
            var result = f.GetValueForLanguage(language, r => r.Title, "de", "en");
            if (String.IsNullOrWhiteSpace(result))
            {
                var v = f.FileVersionForLanguage(language, "de", "en");
                if (v != null) result = v.File.FileName;
            }
            return String.IsNullOrWhiteSpace(result) ? String.Empty : result;
        }

        /// <summary>
        /// Returns a DbFileVersion-Instance representing the file version with the given id.
        /// </summary>
        /// <param name="fileVersionId"></param>
        /// <returns></returns>
        public async Task<DbFileVersion> GetContentFileVersion(int websiteId, int fileVersionId)
        {
            var response = await client.GetAsync("api/websites/" + websiteId.ToString() + "/fileversions/" + fileVersionId.ToString());
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadAsAsync<DbFileVersion>();
            return null;
        }

        /// <summary>
        /// Returns a DbFileThumbnail-Instance representing a thumbnail for the file version with the given id.
        /// </summary>
        /// <param name="fileVersionId"></param>
        /// <returns></returns>
        public async Task<DbThumbnail> GetThumbnail(int websiteId, int fileVersionId, String nameOrSize)
        {
            var response = await client.GetAsync("api/websites/" + websiteId.ToString() + "/fileversions/" + fileVersionId.ToString() + "/thumbnails/" + nameOrSize);
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadAsAsync<DbThumbnail>();
            return null;
        }

        /// <summary>
        /// Returns a IEnumerable&lt;TeaserModel&gt;-Instance that contains all 
        /// teasers placed on the start page.
        /// </summary>
        /// <param name="websiteId"></param>
        /// <returns></returns>
        public async Task<IEnumerable<TeaserModel>> GetTeasers(int websiteId)
        {
            var response = await client.GetAsync("api/websites/" + websiteId.ToString() + "/teasers");
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadAsAsync<IEnumerable<TeaserModel>>();
            return null;
        }

    }

    public class ContentNotFoundException : Exception
    {
    }
}
