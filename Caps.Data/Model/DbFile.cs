using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbFile
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(50)]
        public String FileName { get; set; }
        [MaxLength(50)]
        public String ContentType { get; set; }

        [InverseProperty("File")]
        public ICollection<DbFileVersion> Versions { get; set; }
        [InverseProperty("File")]
        public ICollection<DbFileTag> Tags { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }

        public DbFileVersion AddNewVersion(byte[] data, String userName)
        {
            byte[] hash;
            using (var cryptoProvider = new SHA1CryptoServiceProvider())
                hash = cryptoProvider.ComputeHash(data);
            
            var version = new DbFileVersion
            {
                FileId = Id,
                File = this,
                Hash = hash,
                FileSize = data.Length,
                Created = ChangeInfo.GetChangeInfo(userName),
                Modified = ChangeInfo.GetChangeInfo(userName),
                Content = new DbFileContent
                {
                    Data = data
                }
            };

            if (Versions == null) 
                Versions = new Collection<DbFileVersion>();

            Versions.Add(version);
            return version;
        }

        [NotMapped]
        public bool IsImage
        {
            get
            {
                if (String.IsNullOrWhiteSpace(ContentType))
                    return false;
                return ContentType.StartsWith("image");
            }
        }

        public DbFileVersion GetLatestVersion()
        {
            return Versions != null ? Versions.OrderByDescending(v => v.Id).FirstOrDefault() : null;
        }
    }
}
