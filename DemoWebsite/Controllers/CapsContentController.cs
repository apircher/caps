using Caps.Web.Mvc;
using Caps.Web.Mvc.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace DemoWebsite.Controllers
{
    [SetCulture]
    public class CapsContentController : Controller
    {
        //
        // GET: /CapsContent/
        public ActionResult Index(String id, String language)
        {
            int idValue;
            if (!int.TryParse(id, System.Globalization.NumberStyles.HexNumber, System.Globalization.CultureInfo.InvariantCulture, out idValue))
                return HttpNotFound();

            var caps = DependencyResolver.Current.GetService<ContentService>();
            var content = caps.GetContentById(idValue);
            ViewBag.Content = content;

            if (!String.IsNullOrWhiteSpace(content.TemplateName) && ViewExists(content.TemplateName))
                return View(content.TemplateName);

            return View();
        }

        private bool ViewExists(string name)
        {
            ViewEngineResult result = ViewEngines.Engines.FindView(ControllerContext, name, null);
            return (result.View != null);
        }
	}
}