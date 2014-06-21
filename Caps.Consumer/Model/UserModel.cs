using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{
    public class UserModel
    {
        public bool IsAuthenticated { get; set; }
        public String UserName { get; set; }
        public String[] Roles { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime LastPasswordChangedDate { get; set; }

        public String FirstName { get; set; }
        public String LastName { get; set; }

        public bool HasRegistered { get; set; }
        public String LoginProvider { get; set; }
    }
}
