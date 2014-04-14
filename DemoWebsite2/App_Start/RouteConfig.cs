using Caps.Consumer.Mvc.SiteMap;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace DemoWebsite2
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
            
            routes.MapRoute(
                name: "CapsThumbnail",
                url: "thumbnail/{id}/{name}",
                defaults: new { controller = "Caps", action = "Thumbnail", name = UrlParameter.Optional },
                constraints: new { id = @"^\d+$", name = @"^([a-zA-Z_%\+0-9]+)\.([a-zA-Z0-9]+)$" }
            );

            routes.MapRoute(
                name: "CapsInlineFile",
                url: "file/{id}/{name}",
                defaults: new { controller = "Caps", action = "ContentFile", name = UrlParameter.Optional, inline = true },
                constraints: new { id = @"^\d+$", name = @"^([a-zA-Z_%\+0-9]+)\.([a-zA-Z0-9]+)$" }
            );

            routes.MapRoute(
                name: "CapsDownload",
                url: "download/{id}/{name}",
                defaults: new { controller = "Caps", action = "ContentFile", name = UrlParameter.Optional, inline = false },
                constraints: new { id = @"^\d+$", name = @"^([a-zA-Z_%\+0-9]+)\.([a-zA-Z0-9]+)$" }
            );

            routes.MapRoute(
                name: "CapsContentRoute",
                url: "{name}/{id}-{language}",
                defaults: new { controller = "Caps", action = "Index", language = "de" },
                constraints: new { language = @"^(en|de|es|" + CapsSiteMapNode.LanguagePlaceHolder + ")$", id = @"^[a-fA-F0-9]+$" }
            );

            routes.MapRoute(
                name: "LocalizedDefault",
                url: "{language}/{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional, language = "de" },
                constraints: new { language = @"^(en|de|es|" + CapsSiteMapNode.LanguagePlaceHolder + ")$" }
            );

            routes.MapRoute(
                name: "Default",
                url: "{controller}/{action}/{id}",
                defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}
