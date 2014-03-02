using Caps.Data;
using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    public static class DbContextExtensions
    {
        public static Author GetCurrentAuthor(this CapsDbContext db)
        {
            var identity = System.Threading.Thread.CurrentPrincipal.Identity;
            return db.Users.FirstOrDefault(a => a.UserName == identity.Name);
        }
    }
}