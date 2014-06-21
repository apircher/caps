using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class DbFileContent
    {
        public int FileVersionId { get; set; }
        public byte[] Data { get; set; }
    }
}
