﻿using Caps.Web.UI.App_Start;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.Security;

namespace Caps.Web.UI
{
    // Hinweis: Anweisungen zum Aktivieren des klassischen Modus von IIS6 oder IIS7 
    // finden Sie unter "http://go.microsoft.com/?LinkId=9394801".
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            System.Data.Entity.Database.SetInitializer<Caps.Data.CapsDbContext>(
                new System.Data.Entity.DropCreateDatabaseIfModelChanges<Caps.Data.CapsDbContext>());

            AreaRegistration.RegisterAllAreas();

            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            CapsBundleConfig.RegisterBundles(BundleTable.Bundles);

            RolesConfig.EnsureDefaultRoles();
            RolesConfig.EnsureUserInRole("Administrator");
        }
    }
}