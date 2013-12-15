using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    public static class MultipartStreamProviderExtensions
    {
        public static IList<DbFile> GetFiles(this Collection<HttpContent> items, String userName)
        {
            var result = new List<DbFile>();
            foreach (var item in items)
            {
                if (item.IsFile())
                {
                    var fileBytes = item.ReadFileBytes();
                    var contentDisposition = item.Headers.ContentDisposition;

                    var entity = new DbFile
                    {
                        FileName = contentDisposition.FileName.Trim('"'),
                        ContentType = item.Headers.ContentType.MediaType,
                        Created = ChangeInfo.GetChangeInfo(userName),
                        Modified = ChangeInfo.GetChangeInfo(userName)
                    };

                    var version = entity.AddNewVersion(fileBytes, userName);
                    result.Add(entity);
                }
            }

            return result;
        }

        public static NameValueCollection GetFormData(this Collection<HttpContent> items)
        {
            var result = new NameValueCollection();

            foreach (var item in items)
            {
                var contentDisposition = item.Headers.ContentDisposition;
                if (contentDisposition == null) continue;
                if (!String.IsNullOrWhiteSpace(contentDisposition.FileName)) continue;

                if (String.Equals(contentDisposition.DispositionType, "form-data", StringComparison.OrdinalIgnoreCase))
                {
                    String formFieldValue = item.ReadAsStringAsync().Result;
                    result.Add(contentDisposition.Name.Trim('\"'), formFieldValue);
                }
            }

            return result;
        }

        public static bool IsFile(this HttpContent item)
        {
            var contentDisposition = item.Headers.ContentDisposition;
            return !String.IsNullOrWhiteSpace(contentDisposition.FileName);
        }

        public static byte[] ReadFileBytes(this HttpContent item)
        {
            var stream = item.ReadAsStreamAsync().Result;
            using (BinaryReader reader = new BinaryReader(stream))
                return reader.ReadBytes((int)stream.Length);
        }
    }
}