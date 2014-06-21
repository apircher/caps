using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class Tag
    {
        public int Id { get; set; }
        public String Name { get; set; }
        public ICollection<DbFileTag> Files { get; set; }
    }
}
