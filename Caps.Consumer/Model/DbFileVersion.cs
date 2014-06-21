using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbFileVersion
    {
        public int Id { get; set; }
        public int FileId { get; set; }
        public int FileSize { get; set; }

        public byte[] Hash { get; set; }

        public String Notes { get; set; }

        public DbFile File { get; set; }
        public DbFileContent Content { get; set; }
        public ICollection<DbFileProperty> Properties { get; set; }
        public ICollection<DbThumbnail> Thumbnails { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }
    }
}
