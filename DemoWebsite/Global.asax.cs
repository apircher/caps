﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace DemoWebsite
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            var contentControlRegistry = DependencyResolver.Current.GetService<Caps.Data.ContentControls.ContentControlRegistry>();
            contentControlRegistry.RegisterControl("slideshow", new Caps.Data.ContentControls.Slideshow());
        }
    }
}
