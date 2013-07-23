using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using System.Web.Security;
using Caps.Web.UI.Infrastructure;
using Caps.Data.Model;
using WebMatrix.WebData;

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
            CreationDate = WebSecurity.GetCreateDate(author.UserName);
            Email = author.Email;
            IsApproved = WebSecurity.IsConfirmed(author.UserName);
            IsLockedOut = author.IsLockedOut();
            LastActivityDate = author.LastActivityDate.GetValueOrDefault(DateTime.MinValue);
            LastLockoutDate = WebSecurity.GetLastPasswordFailureDate(author.UserName);
            LastLoginDate = author.LastLoginDate.GetValueOrDefault(DateTime.MinValue);
            LastPasswordChangedDate = WebSecurity.GetPasswordChangedDate(author.UserName);
            Roles = author.GetRoles();
        }

        [Required]
        public String UserName { get; set; }
        public String Password { get; set; }
        public String Comment { get; set; }
        public DateTime CreationDate { get; set; }
        [Required]
        public String Email { get; set; }
        public bool IsApproved { get; set; }
        public bool IsLockedOut { get; set; }
        public bool IsOnline { get; set; }
        public DateTime LastActivityDate { get; set; }
        public DateTime LastLockoutDate { get; set; }
        public DateTime LastLoginDate { get; set; }
        public DateTime LastPasswordChangedDate { get; set; }

        public String[] Roles { get; set; }

        public void UpdateAuthor(Author author)
        {
            author.Comment = Comment;
            author.Email = Email;

            UpdateRoles(author);
        }

        void UpdateRoles(Author author)
        {
            var currentRoles = System.Web.Security.Roles.GetRolesForUser(UserName);

            var rolesToAdd = new String[0];
            if (Roles != null)
                rolesToAdd = Roles.Where(r => !currentRoles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToArray();
            var rolesToRemove = Roles != null ? currentRoles.Where(r => !Roles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToArray() : currentRoles;

            if (rolesToRemove.Contains("Administrator", StringComparer.OrdinalIgnoreCase) && author.IsLastUserInRole("Administrator"))
                throw new InvalidOperationException("Der letzte Administrator kann nicht entfernt werden.");
            
            Array.ForEach(rolesToAdd, r => System.Web.Security.Roles.AddUserToRole(UserName, r));
            Array.ForEach(rolesToRemove, r => System.Web.Security.Roles.RemoveUserFromRole(UserName, r));
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