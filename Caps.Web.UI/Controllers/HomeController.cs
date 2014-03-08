using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.Mvc;
using Caps.Web.UI.Models;
using Microsoft.AspNet.Identity;
using Microsoft.Owin.Security;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace Caps.Web.UI.Controllers
{
    [SetUserActivity, OutputCache(VaryByParam = "*", Duration = 0, NoStore = true)]
    public class HomeController : Controller
    {
        //
        // GET: /Caps/

        public ActionResult Index() 
        {
            return View();
        }     
    }
}
