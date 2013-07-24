using Caps.Data;
using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using Caps.Web.UI.Infrastructure.WebApi;
using Caps.Web.UI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Security;
using WebMatrix.WebData;

namespace Caps.Web.UI.Controllers
{
    [Authorize(Roles = "Administrator"), ValidateJsonAntiForgeryToken, SetUserActivity]
    public class UserController : ApiController
    {
        CapsDbContext db;

        public UserController(CapsDbContext db) 
        {
            this.db = db;
        }

        public IList<UserModel> GetAll()
        {
            var authors = db.Authors.ToList();
            return authors.Select(u => new UserModel(u)).ToList();
        }

        public HttpResponseMessage Get(String id)
        {
            var author = db.GetAuthorByUserName(id);
            if (author == null)
                return Request.CreateResponse(HttpStatusCode.BadRequest);            
            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(author));
        }

        public HttpResponseMessage Put(UserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            // Ensure unique username.
            if (WebSecurity.UserExists(model.UserName))
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = "Der Benutzername ist bereits vergeben.", ErrorId = "duplicate_username" });

            // Add the user.
            try
            {
                WebSecurity.CreateUserAndAccount(model.UserName, model.Password, new { Email = model.Email, FirstName = model.FirstName, LastName = model.LastName });
            }
            catch (MembershipCreateUserException)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = "Der Benutzer konnte nicht erstellt werden.", ErrorId = "createuser_exception" });
            }

            var author = db.GetAuthorByUserName(model.UserName);
            model.UpdateAuthor(author);
            
            db.SaveChanges();
            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(author));
        }

        public HttpResponseMessage Post(UserModel model)
        {
            if (!ModelState.IsValid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            if (!WebSecurity.UserExists(model.UserName))
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var author = db.GetAuthorByUserName(model.UserName);
            try
            {
                model.UpdateAuthor(author);
            }
            catch (InvalidOperationException ex)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, new { ErrorMessage = ex.Message, ErrorId = "updateuser_exception" });
            }

            db.SaveChanges();
            return Request.CreateResponse(HttpStatusCode.OK, new UserModel(author));
        }

        public HttpResponseMessage Delete(UserModel model)
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
    }
}
