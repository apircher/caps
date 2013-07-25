using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    [ComplexType]
    public class ChangeInfo
    {
        [MaxLength(50)]
        public String By { get; set; }
        public DateTime At { get; set; }
    }
}
