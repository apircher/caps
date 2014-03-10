using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Infrastructure;
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

        [Authorize(Roles = "Administrator")]
        [Route("GetAllUsers")]        
        public IList<UserModel> GetAll()
        {
            var authors = db.Users.ToList();
            return authors.Select(u => new UserModel(u)).ToList();
        }

        [Authorize(Roles = "Administrator")]
        [Route("GetUser")]
        public HttpResponseMessage GetUser(String userName)
        {
            var author = db.GetAuthorByUserName(userName);
            if (author == null)
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(author));
        }

        [Authorize(Roles = "Administrator")]
        [HttpPost]
        [Route("CreateUser")]
        public HttpResponseMessage CreateUser(UserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            // Ensure unique username.
            var user = db.Users.FirstOrDefault(u => u.UserName == model.UserName);
            if (user != null)
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = "Der Benutzername ist bereits vergeben.", ErrorId = "duplicate_username" });

            // Add the user.
            try
            {
                user = new Author
                {
                    UserName = model.UserName,
                    Email = model.Email,
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    CreationDate = DateTime.UtcNow,
                    LastPasswordChangedDate = DateTime.UtcNow
                };
                var result = userManager.Create(user, model.Password);
                if (!result.Succeeded)
                {
                    foreach (var err in result.Errors)
                        ModelState.AddModelError("", err);
                    return Request.CreateResponse(HttpStatusCode.BadRequest, ModelState);
                }
            }
            catch (Exception)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = "Der Benutzer konnte nicht erstellt werden.", ErrorId = "createuser_exception" });
            }

            if (user == null)
                return Request.CreateResponse(HttpStatusCode.InternalServerError);

            model.UpdateAuthor(user, userManager);

            db.SaveChanges();
            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(user));
        }

        [Authorize(Roles = "Administrator")]
        [HttpPost]
        [Route("UpdateUser")]
        public HttpResponseMessage UpdateUser(UserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var author = db.GetAuthorByUserName(model.UserName);
            if (author == null)
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            try
            {
                model.UpdateAuthor(author, userManager);
            }
            catch (InvalidOperationException ex)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = ex.Message, ErrorId = "updateuser_exception" });
            }

            db.SaveChanges();
            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(author));
        }

        [Authorize(Roles = "Administrator")]
        [HttpPost]
        [Route("DeleteUser")]
        public HttpResponseMessage DeleteUser(UserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            if (String.Equals(model.UserName, System.Web.HttpContext.Current.User.Identity.Name))
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            try
            {
                // Delete the Author
                var author = db.GetAuthorByUserName(model.UserName);
                if (author == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                author.DeleteAuthorAndAccount(db);
                db.SaveChanges();

                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError,
                    new { ErrorMessage = "Beim Löschen des Benutzers ist eine unbehandelte Ausnahme aufgetreten.", ErrorId = "deleteuser_exception" });
            }
        }

        [Authorize(Roles = "Administrator")]
        [HttpPost]
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

        [Authorize(Roles = "Administrator")]
        [HttpPost]
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
