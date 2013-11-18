using Caps.Web.Mvc.Attributes;
using Caps.Web.Mvc.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace DemoWebsite.Controllers
{
    [SetCulture]
    public class HomeController : Controller
    {
        //
        // GET: /Home/
        public ActionResult Index()
        {
            var caps = DependencyResolver.Current.GetService<Caps.Web.Mvc.ContentService>();
            ViewBag.Teasers = caps.GetTeasers() ?? new List<TeaserModel>();
            return View();
        }

        public ActionResult MyAction()
        {
            return View();
        }
	}
}