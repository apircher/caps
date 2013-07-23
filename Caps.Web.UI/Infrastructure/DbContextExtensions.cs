using Caps.Data;
using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.WebData;

namespace Caps.Web.UI.Infrastructure
{
    public static class DbContextExtensions
    {
        public static Author GetCurrentAuthor(this CapsDbContext db)
        {
            return db.Authors.FirstOrDefault(a => a.Id == WebSecurity.CurrentUserId);
        }
    }
}