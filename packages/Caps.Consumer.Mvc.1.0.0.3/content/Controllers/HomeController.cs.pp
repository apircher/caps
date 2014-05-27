using Caps.Consumer;
using Caps.Consumer.Mvc.Attributes;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace $rootnamespace$.Controllers
{
    [SetCulture]
    public class HomeController : Controller
    {
        public async Task<ActionResult> Index()
        {
            var rootNode = SiteMap.RootNode as Caps.Consumer.Mvc.SiteMap.CapsSiteMapNode;
            if (rootNode != null)
            {
                CapsHttpClient client = new CapsHttpClient(new Uri(ConfigurationManager.AppSettings["caps:Url"]),
                    ConfigurationManager.AppSettings["caps:AppKey"],
                    ConfigurationManager.AppSettings["caps:AppSecret"]);
                var svc = new ContentService(client);
                var content = await svc.GetContent(1, rootNode.PermanentId);
                ViewBag.Content = content;
            }

            return View();
        }
    }
}