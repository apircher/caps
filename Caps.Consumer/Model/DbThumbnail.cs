using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbThumbnail
    {
        public int Id { get; set; }
        public int FileVersionId { get; set; }
        public byte[] OriginalFileHash { get; set; }
        public String ContentType { get; set; }
        public String Name { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public byte[] Data { get; set; }
    }
}
