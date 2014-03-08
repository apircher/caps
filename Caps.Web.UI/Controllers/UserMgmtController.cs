using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Security;

namespace Caps.Web.UI.Controllers
{
    [Authorize, ValidateJsonAntiForgeryToken, SetUserActivity]
    [RoutePrefix("api/usermgmt")]
    public class UserMgmtController : ApiController
    {
        UserManager<Author> userManager;
        CapsDbContext db;

        public UserMgmtController(UserManager<Author> userManager, CapsDbContext db)
        {
            this.userManager = userManager;
            this.db = db;
        }

        [HttpPost, Authorize(Roles = "Administrator")]
        [Route("IsUsernameUnique")]
        public HttpResponseMessage IsUserNameUnique(PropertyValidationModel model)
        {
            var user = userManager.FindByName(model.Value);
            if (user == null)
                return Request.CreateResponse(HttpStatusCode.OK, true);
            return Request.CreateResponse(HttpStatusCode.OK, false);
        }

        [HttpGet]
        [Route("GetAllRoles")]
        public HttpResponseMessage GetAllRoles()
        {
            var allRoles = db.Roles.Select(r => r.Name).ToArray();
            return Request.CreateResponse(HttpStatusCode.OK, allRoles); 
        }

        [HttpPost, Authorize(Roles = "Administrator")]
        [Route("SetPassword")]
        public async Task<HttpResponseMessage> SetPassword(SetPasswordModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var user = userManager.FindByName(model.UserName);
            if (user == null)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var store = new UserStore<Author>(db);
            await store.SetPasswordHashAsync(user, userManager.PasswordHasher.HashPassword(model.NewPassword));
            user.LastPasswordChangedDate = DateTime.UtcNow;

            await store.UpdateAsync(user);
            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
