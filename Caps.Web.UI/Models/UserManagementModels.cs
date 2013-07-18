using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using System.Web.Security;
using Caps.Web.UI.Infrastructure;

namespace Caps.Web.UI.Models
{
    public class UserModel
    {
        public UserModel()
        {
        }
        public UserModel(MembershipUser msu) : this(msu, new String[0]) 
        {
        }
        public UserModel(MembershipUser msu, String[] roles)
        {
            UserName = msu.UserName;
            Comment = msu.Comment;
            CreationDate = msu.CreationDate;
            Email = msu.Email;
            IsApproved = msu.IsApproved;
            IsLockedOut = msu.IsLockedOut;
            IsOnline = msu.IsOnline && (msu.LastLoginDate != msu.CreationDate);
            LastActivityDate = msu.LastActivityDate;
            LastLockoutDate = msu.LastLockoutDate;
            LastLoginDate = msu.LastLoginDate;
            LastPasswordChangedDate = msu.LastPasswordChangedDate;

            Roles = roles;
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

        public void UpdateMembershipUser(MembershipUser msu)
        {
            msu.Comment = Comment;
            msu.Email = Email;

            UpdateRoles(msu);
        }

        void UpdateRoles(MembershipUser msu)
        {
            var currentRoles = System.Web.Security.Roles.GetRolesForUser(UserName);

            var rolesToAdd = new String[0];
            if (Roles != null)
                rolesToAdd = Roles.Where(r => !currentRoles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToArray();
            var rolesToRemove = Roles != null ? currentRoles.Where(r => !Roles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToArray() : currentRoles;

            if (rolesToRemove.Contains("Administrator", StringComparer.OrdinalIgnoreCase) && msu.IsLastUserInRole("Administrator"))
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

    public class UnlockUserModel
    {
        [Required]
        public String UserName { get; set; }
    }

    public class SetPasswordModel
    {
        [Required]
        public String UserName { get; set; }
        [Required]
        public String NewPassword { get; set; }
    }
}