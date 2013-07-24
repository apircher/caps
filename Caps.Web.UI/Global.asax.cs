using Caps.Web.UI.App_Start;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.Security;
using WebMatrix.WebData;

namespace Caps.Web.UI
{
    // Hinweis: Anweisungen zum Aktivieren des klassischen Modus von IIS6 oder IIS7 
    // finden Sie unter "http://go.microsoft.com/?LinkId=9394801".
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            InitializeDatabase();
                        
            AreaRegistration.RegisterAllAreas();

            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            CapsBundleConfig.RegisterBundles(BundleTable.Bundles);
        }

        void InitializeDatabase()
        {
#if DEBUG
            System.Data.Entity.Database.SetInitializer<Caps.Data.CapsDbContext>(
                new System.Data.Entity.DropCreateDatabaseIfModelChanges<Caps.Data.CapsDbContext>());
#endif
            try
            {
                using (var context = new Caps.Data.CapsDbContext())
                {
                    context.Database.CreateIfNotExists();
                    context.Database.Initialize(false);
                }

                WebSecurity.InitializeDatabaseConnection("CapsDbContext", "Author", "Id", "UserName", true);

                RolesConfig.EnsureDefaultRoles();
                RolesConfig.EnsureUserInRole("Administrator");
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Die ASP.NET Simple Membership-Datenbank konnte nicht initialisiert werden. Weitere Informationen finden Sie unter http://go.microsoft.com/fwlink/?LinkId=256588", ex);
            }
        }
    }
}