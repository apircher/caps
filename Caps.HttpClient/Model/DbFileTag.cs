using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbFileTag
    {
        public int FileId { get; set; }
        public int TagId { get; set; }
        public DbFile File { get; set; }
        public Tag Tag { get; set; }
    }
}
