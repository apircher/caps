using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using System.Web.Security;
using Caps.Web.UI.Infrastructure;
using Caps.Data.Model;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;

namespace Caps.Web.UI.Models
{
    public class UserModel
    {
        public UserModel()
        {
        }
        public UserModel(Author author)
        {
            UserName = author.UserName;
            Comment = author.Comment;
            CreationDate = author.CreationDate;
            Email = author.Email;
            Phone = author.Phone;
            IsLockedOut = author.IsLockedOut();
            LastActivityDate = new DateTime(author.LastActivityDate.GetValueOrDefault(DateTime.MinValue).Ticks, DateTimeKind.Utc);
            LastLockoutDate = new DateTime(author.LastLockoutDate.GetValueOrDefault(DateTime.MinValue).Ticks, DateTimeKind.Utc);
            LastLoginDate = new DateTime(author.LastLoginDate.GetValueOrDefault(DateTime.MinValue).Ticks, DateTimeKind.Utc);
            LastPasswordChangedDate = new DateTime(author.LastPasswordChangedDate.GetValueOrDefault(author.CreationDate).Ticks, DateTimeKind.Utc);
            Roles = author.GetRoles();

            FirstName = author.FirstName;
            LastName = author.LastName;
        }

        [Required]
        public String UserName { get; set; }
        public String Password { get; set; }
        public String Comment { get; set; }
        public DateTime CreationDate { get; set; }
        [Required]
        public String Email { get; set; }
        public String Phone { get; set; }
        public bool IsApproved { get; set; }
        public bool IsLockedOut { get; set; }
        public bool IsOnline { get; set; }
        public DateTime LastActivityDate { get; set; }
        public DateTime LastLockoutDate { get; set; }
        public DateTime LastLoginDate { get; set; }
        public DateTime LastPasswordChangedDate { get; set; }

        [Required]
        public String FirstName { get; set; }
        [Required]
        public String LastName { get; set; }

        public String[] Roles { get; set; }

        public void UpdateAuthor(Author author, UserManager<Author> userManager)
        {
            author.Comment = Comment;
            author.Email = Email;
            author.Phone = Phone;

            author.FirstName = FirstName;
            author.LastName = LastName;

            UpdateRoles(author, userManager);
        }

        void UpdateRoles(Author author, UserManager<Author> userManager)
        {
            var currentRoles = author.Roles.Select(r => r.Role.Name).ToArray();

            var rolesToAdd = new String[0];
            if (Roles != null)
                rolesToAdd = Roles.Where(r => !currentRoles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToArray();
            var rolesToRemove = Roles != null ? currentRoles.Where(r => !Roles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToArray() : currentRoles;

            if (rolesToRemove.Contains("Administrator", StringComparer.OrdinalIgnoreCase) && author.IsLastUserInRole("Administrator"))
                throw new InvalidOperationException("Der letzte Administrator kann nicht entfernt werden.");

            Array.ForEach(rolesToAdd, r => userManager.AddToRole(author.Id, r));
            Array.ForEach(rolesToRemove, r => userManager.RemoveFromRole(author.Id, r));
        }
    }

    public class PropertyValidationModel
    {
        public String Value { get; set; }
        public String Param { get; set; }
    }

    public class SetPasswordModel
    {
        [Required]
        public String UserName { get; set; }
        [Required]
        public String NewPassword { get; set; }
    }
}