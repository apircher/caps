using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data
{
    public class CapsDbContext : DbContext
    {
        public CapsDbContext() : base("CapsDbContext")
        {
            Configuration.ProxyCreationEnabled = false;
            Configuration.LazyLoadingEnabled = false;
        }

        public DbSet<Website> Websites { get; set; }
        public DbSet<Sitemap> Sitemaps { get; set; }
    }
}
