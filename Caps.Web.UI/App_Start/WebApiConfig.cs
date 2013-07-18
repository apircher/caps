using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace Caps.Web.UI
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            config.Routes.MapHttpRoute(
                name: "RpcStyleApi",
                routeTemplate: "rpc/{controller}/{action}"
            );
        }
    }
}
