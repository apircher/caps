using Caps.Consumer;
using Caps.Consumer.ContentControls;
using Caps.Consumer.Mvc.SiteMap;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace $rootnamespace$
{
    public static class CapsConfig
    {
        public static void RegisterContentControls()
        {
            var controlsRegistry = DependencyResolver.Current.GetService<ContentControlRegistry>();

            //TODO: Configure content controls.

            CapsConfiguration.ContentControlRegistryFactory = () => controlsRegistry;
        }

		static readonly String contentNamePattern = String.Format(@"^(?!(en|de|{0})$).*$", CapsSiteMapNode.LanguagePlaceHolder);
		static readonly String languagePattern = String.Format(@"^(en|de|{0})$", CapsSiteMapNode.LanguagePlaceHolder);
		const String defaultLanguage = "de";
		const String hexNumberPattern = @"^[a-fA-F0-9]+$";
		const String fileNamePattern = @"^([a-zA-Z\-_%\+0-9]+)\.([a-zA-Z0-9]+)$";
		

		public static void RegisterRoutes(RouteCollection routes) 
		{
			routes.MapRoute(
				name: "CapsContentRoute",
				url: "{name}/{id}-{language}",
				defaults: new { controller = "Caps", action = "Index", language = defaultLanguage },
				constraints: new { language = languagePattern, id = hexNumberPattern }
            );

            routes.MapRoute(
				name: "ContentFileThumbnail",
				url: "thmb/{language}/{id}/{name}",
				defaults: new { controller = "Caps", action = "Thumbnail", name = UrlParameter.Optional, language = defaultLanguage },
				constraints: new { id = @"^\d+$", name = fileNamePattern, language = languagePattern }
            );

            routes.MapRoute(
				name: "ContentFileInline",
				url: "file/{language}/{id}/{name}",
				defaults: new { controller = "Caps", action = "ContentFile", name = UrlParameter.Optional, inline = true, language = defaultLanguage },
				constraints: new { id = @"^\d+$", name = fileNamePattern, language = languagePattern }
            );

            routes.MapRoute(
				name: "ContentFileDownload",
				url: "download/{language}/{id}/{name}",
				defaults: new { controller = "Caps", action = "ContentFile", name = UrlParameter.Optional, inline = false, language = defaultLanguage },
				constraints: new { id = @"^\d+$", name = fileNamePattern, language = languagePattern }
            );

            routes.MapRoute(
				name: "ContentByName",
				url: "{name}/{language}",
				defaults: new { controller = "Caps", action = "ContentByName", language = defaultLanguage },
				constraints: new { language = languagePattern, name = contentNamePattern }
            );

            routes.MapRoute(
				name: "LocalizedDefault",
				url: "{language}/{controller}/{action}/{id}",
				defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional, language = defaultLanguage },
				constraints: new { language = languagePattern }
            );		
		}
    }
}