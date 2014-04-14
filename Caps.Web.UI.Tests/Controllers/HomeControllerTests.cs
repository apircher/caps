using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Caps.Web.UI.Controllers;
using System.Web.Mvc;

namespace Caps.Web.UI.Tests.Controllers
{
    [TestClass]
    public class HomeControllerTests
    {
        [TestMethod]
        public void Index()
        {
            var controller = new HomeController();

            var result = controller.Index() as ViewResult;

            Assert.IsNotNull(result);
        }
    }
}
