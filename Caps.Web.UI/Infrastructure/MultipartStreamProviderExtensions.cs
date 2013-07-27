using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
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

                    byte[] hash;
                    using (var cryptoProvider = new SHA1CryptoServiceProvider())
                        hash = cryptoProvider.ComputeHash(fileBytes);

                    var entity = new DbFile
                    {
                        FileName = contentDisposition.FileName.Trim('"'),
                        ContentType = item.Headers.ContentType.MediaType,
                        Created = ChangeInfo.GetChangeInfo(userName),
                        Modified = ChangeInfo.GetChangeInfo(userName)
                    };

                    var version = new DbFileVersion
                    {
                        Hash = hash,
                        FileSize = fileBytes.Length,
                        Created = ChangeInfo.GetChangeInfo(userName),
                        Modified = ChangeInfo.GetChangeInfo(userName),
                        Content = new DbFileContent
                        {
                            Data = fileBytes
                        }
                    };

                    entity.Versions = new Collection<DbFileVersion>();
                    entity.Versions.Add(version);

                    result.Add(entity);
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