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
        public UserModel(Author author, IEnumerable<String> roles)
        {
            UserName = author.UserName;
            Comment = author.Comment;
            CreationDate = author.CreationDate;
            Email = author.Email;
            Phone = author.PhoneNumber;
            IsLockedOut = author.LockoutEndDateUtc >= DateTime.UtcNow;
            LastActivityDate = new DateTime(author.LastActivityDate.GetValueOrDefault(DateTime.MinValue).Ticks, DateTimeKind.Utc);
            LastLockoutDate = new DateTime(author.LockoutEndDateUtc.GetValueOrDefault(DateTime.MinValue).Ticks, DateTimeKind.Utc);
            LastLoginDate = new DateTime(author.LastLoginDate.GetValueOrDefault(DateTime.MinValue).Ticks, DateTimeKind.Utc);
            LastPasswordChangedDate = new DateTime(author.LastPasswordChangedDate.GetValueOrDefault(author.CreationDate).Ticks, DateTimeKind.Utc);

            Roles = roles.ToArray();

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

        public void UpdateAuthor(Author author, ApplicationUserManager userManager, ApplicationRoleManager roleManager)
        {
            author.Comment = Comment;
            author.Email = Email;
            author.PhoneNumber = Phone;

            author.FirstName = FirstName;
            author.LastName = LastName;

            UpdateRoles(author, userManager, roleManager);
        }

        void UpdateRoles(Author author, ApplicationUserManager userManager, ApplicationRoleManager roleManager)
        {
            var currentRoles = userManager.GetRoles(author.Id).ToArray();

            var rolesToAdd = new String[0];
            if (Roles != null)
                rolesToAdd = Roles.Where(r => !currentRoles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToArray();
            var rolesToRemove = Roles != null ? currentRoles.Where(r => !Roles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToArray() : currentRoles;

            if (rolesToRemove.Contains("Administrator", StringComparer.OrdinalIgnoreCase) && userManager.IsLastUserInRole(author.UserName, "Administrator"))
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
        [StringLength(100, ErrorMessage = "Das neue Passwort muss mindestens {2} Zeichen lang sein.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "Neues Passwort")]
        public String NewPassword { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Neues Passwort bestätigen")]
        [Compare("NewPassword", ErrorMessage = "Das neue Passwort stimmt nicht mit dem Bestätigungspasswort überein.")]
        public String ConfirmPassword { get; set; }
    }
}