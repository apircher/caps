using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbFile
    {
        public int Id { get; set; }
        public String FileName { get; set; }
        public String ContentType { get; set; }
        public ICollection<DbFileVersion> Versions { get; set; }
        public ICollection<DbFileTag> Tags { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }

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
