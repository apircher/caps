using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Caps.Web.UI.Controllers;
using System.Net.Http;
using System.Dynamic;
using System.Threading.Tasks;

namespace Caps.Web.UI.Tests.Controllers
{
    [TestClass]
    public class AntiForgeryTokenControllerTests
    {
        [TestMethod]
        public void GetTokens()
        {
            var controller = CreateController();

            var result = controller.GetTokens();

            Assert.IsNotNull(result);
        }

        [TestMethod]
        public void GetTokens_Should_Return_Ok()
        {
            var controller = CreateController();

            var result = controller.GetTokens();

            Assert.AreEqual(result.StatusCode, System.Net.HttpStatusCode.OK);
        }

        [TestMethod]
        public async Task GetTokens_Returns_Tokens()
        {
            var controller = CreateController();

            var result = controller.GetTokens();

            dynamic data = await result.Content.ReadAsAsync<ExpandoObject>();

            Assert.IsNotNull(data);
            Assert.AreEqual(data.c, TestCookieToken);
            Assert.AreEqual(data.f, TestFormToken);
        }

        #region Test Infrastructure

        IAntiForgeryTokenProvider tokenProvider = new TestAntiForgeryTokenProvider();
        const String TestCookieToken = "AAAAAAAAAA";
        const String TestFormToken = "BBBBBBBBBB";

        AntiForgeryTokenController CreateController()
        {
            var controller = new AntiForgeryTokenController(tokenProvider);
            controller.Request = new HttpRequestMessage();
            controller.Request.SetConfiguration(new System.Web.Http.HttpConfiguration());
            return controller;
        }

        public class TestAntiForgeryTokenProvider : IAntiForgeryTokenProvider
        {
            public void GetTokens(string oldCookieToken, out string newCookieToken, out string formToken)
            {
                newCookieToken = TestCookieToken;
                formToken = TestFormToken;
            }
        }

        #endregion
    }
}
