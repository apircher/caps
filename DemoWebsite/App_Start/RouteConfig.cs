using Caps.Web.Mvc.Sitemap;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace DemoWebsite
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
            
            routes.MapRoute(
                name: "CapsContentRoute",
                url: "{name}/{id}-{language}",
                defaults: new { controller = "CapsContent", action = "Index", language = "de" },
                constraints: new { language = @"^(en|de|es|" + CapsSiteMapNode.LanguagePlaceHolder + ")$", id = @"^[a-fA-F0-9]+$" }
            );

            routes.MapRoute(
                name: "Default",
                url: "{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}
