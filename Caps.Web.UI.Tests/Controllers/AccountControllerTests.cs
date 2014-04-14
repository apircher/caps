using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Threading;
using System.Security.Principal;
using System.Security.Claims;
using Caps.Web.UI.Controllers;
using Microsoft.AspNet.Identity;
using Caps.Data.Model;
using Moq;
using Caps.Data;
using System.Data.Entity;
using Microsoft.AspNet.Identity.EntityFramework;
using System.Collections.Generic;
using System.Linq;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using Moq.Protected;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using System.Net;
using System.Net.Http;

namespace Caps.Web.UI.Tests.Controllers
{
    [TestClass]
    public class AccountControllerTests
    {
        [TestMethod]
        public void GetUserInfo() 
        {
            Thread.CurrentPrincipal = new ClaimsPrincipal(new GenericIdentity("foo"));

            var controller = CreateAccountController();

            var result = controller.GetUserInfo();

            Assert.IsNotNull(result);
        }

        [TestMethod]
        public void GetUserInfo_returns_UserName_of_CurrentPrincipal() 
        {
            Thread.CurrentPrincipal = new ClaimsPrincipal(new GenericIdentity("foo"));

            var controller = CreateAccountController();

            var result = controller.GetUserInfo();

            Assert.AreEqual(result.UserName, "foo");
        }

        [TestMethod]
        public void GetUserInfo_returns_True_for_IsAuthenticated_when_user_is_authenticated() 
        {
            Thread.CurrentPrincipal = new ClaimsPrincipal(new GenericIdentity("foo"));

            var controller = CreateAccountController();

            var result = controller.GetUserInfo();

            Assert.AreEqual(true, result.IsAuthenticated);
        }

        [TestMethod]
        public void GetUserInfo_returns_False_for_IsAuthenticated_when_user_is_not_authenticated() 
        {
            Thread.CurrentPrincipal = null;

            var controller = CreateAccountController();

            var result = controller.GetUserInfo();

            Assert.AreEqual(false, result.IsAuthenticated);
        }

        [TestMethod]
        public void GetAuthenticationMetadata() 
        {
            var controller = CreateAccountController();

            var result = controller.GetAuthenticationMetadata();

            Assert.IsNotNull(result);
        }

        [TestMethod]
        public async Task Logout() 
        {
            var authenticationManagerMock = new Mock<IAuthenticationManager>();
            authenticationManagerMock.Setup(m => m.SignOut());

            var controllerMock = CreateAccountControllerMock();
            controllerMock.CallBase = true;
            controllerMock.Protected()
                .SetupGet<IAuthenticationManager>("Authentication")
                .Returns(authenticationManagerMock.Object);

            var controller = controllerMock.Object;

            var result = controller.Logout();
            Assert.IsNotNull(result);

            var r2 = await result.ExecuteAsync(CancellationToken.None);
            Assert.AreEqual(r2.StatusCode, HttpStatusCode.OK);
        }

        [TestMethod]
        public void Logout_calls_SignOut() 
        {
            var authenticationManagerMock = new Mock<IAuthenticationManager>();
            authenticationManagerMock.Setup(m => m.SignOut());

            var controllerMock = CreateAccountControllerMock();
            controllerMock.CallBase = true;
            controllerMock.Protected()
                .SetupGet<IAuthenticationManager>("Authentication")
                .Returns(authenticationManagerMock.Object);

            var controller = controllerMock.Object;

            var result = controller.Logout();

            authenticationManagerMock.Verify(m => m.SignOut(CookieAuthenticationDefaults.AuthenticationType));
        }

        #region Test Infrastructure

        AccountController CreateAccountController()
        {
            var db = CreateDbContextMock();
            var userManager = CreateTestUserManager(db);
            var controller = new AccountController(userManager, db.Object);

            controller.Request = new HttpRequestMessage();
            controller.Request.SetConfiguration(new System.Web.Http.HttpConfiguration());

            return controller;
        }

        Mock<AccountController> CreateAccountControllerMock()
        {
            var db = CreateDbContextMock();
            var userManager = CreateTestUserManager(db);
            var controllerMock = new Mock<AccountController>(userManager, db.Object);

            controllerMock.Object.Request = new HttpRequestMessage();
            controllerMock.Object.Request.SetConfiguration(new System.Web.Http.HttpConfiguration());

            return controllerMock;
        }

        Mock<CapsDbContext> CreateDbContextMock()
        {
            var db = new Mock<CapsDbContext>() { CallBase = true };

            db.Setup(m => m.Users).Returns(CreateMockDbSetWithData(new List<Author>
            {
                new Author { 
                    Id = "94960981-B627-45F2-B418-49399FFC570F",
                    FirstName = "Andreas", 
                    LastName = "Pircher", 
                    UserName = "foo", 
                    CreationDate = new DateTime(1977, 1, 18, 22, 0, 0)
                }
            })
            .Object);

            db.Setup(m => m.Roles).Returns(CreateMockDbSetWithData(new List<IdentityRole>()
            {
                new IdentityRole { Id = "3991210C-688B-47C5-BCC9-192DF8E3893D", Name = "Administrator" }
            })
            .Object);

            return db;
        }

        UserManager<Author> CreateTestUserManager(Mock<CapsDbContext> mockDbContext)
        {
            var userStore = new Mock<UserStore<Author>>(mockDbContext.Object);
            userStore.Setup(m => m.FindByNameAsync("foo"))
                .Returns(Task.FromResult(mockDbContext.Object.Users.FirstOrDefault(u => String.Equals(u.UserName, "foo"))));
            return new UserManager<Author>(userStore.Object);
        }

        Mock<DbSet<T>> CreateMockDbSetWithData<T>(List<T> data) where T : class
        {
            var mockDbSet = Activator.CreateInstance<Mock<DbSet<T>>>();
            MockDbSetData(mockDbSet, data);
            return mockDbSet;
        }

        void MockDbSetData<T>(Mock<DbSet<T>> mockDbSet, List<T> data) where T : class
        {
            var q = data.AsQueryable();

            mockDbSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(q.Provider);
            mockDbSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(q.Expression);
            mockDbSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(q.ElementType);
            mockDbSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(q.GetEnumerator());
        }

        #endregion
    }
}
