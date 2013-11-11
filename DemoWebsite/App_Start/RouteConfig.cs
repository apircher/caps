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
                name: "ContentFileInline",
                url: "file/{id}/{name}",
                defaults: new { controller = "CapsContent", action = "ContentFile", name = UrlParameter.Optional, inline = true },
                constraints: new { id = @"^\d+$", name = @"^([a-zA-Z_0-9]+).([a-zA-Z0-9]+)$" }
            );

            routes.MapRoute(
                name: "ContentFileDownload",
                url: "download/{id}/{name}",
                defaults: new { controller = "CapsContent", action = "ContentFile", name = UrlParameter.Optional, inline = false },
                constraints: new { id = @"^\d+$", name = @"^([a-zA-Z_0-9]+).([a-zA-Z0-9]+)$" }
            );

            routes.MapRoute(
                name: "ContentFileThumbnail",
                url: "thumbnail/{id}/{name}",
                defaults: new { controller = "CapsContent", action = "Thumbnail", name = UrlParameter.Optional },
                constraints: new { id = @"^\d+$", name = @"^([a-zA-Z_0-9]+).([a-zA-Z0-9]+)$" }
            );

            routes.MapRoute(
                name: "Default",
                url: "{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}
