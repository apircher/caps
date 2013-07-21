using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using System.Web.Security;

namespace Caps.Web.UI.Models
{
    public class AuthenticationMetadata
    {
        public int LockoutPeriod { get; set; }
        public int MinRequiredPasswordLength { get; set; }
    }

    public class LoginModel
    {
        [Required]
        public String UserName { get; set; }
        [Required]
        public String Password { get; set; }

        public bool RememberMe { get; set; }
    }

    public class AuthenticatedUserModel
    {
        public AuthenticatedUserModel()
        {
        }
        public AuthenticatedUserModel(MembershipUser user, String[] roles = null)
        {
            if (user == null)
                throw new ArgumentNullException("The parameter user may not be null");

            IsAuthenticated = true;
            UserName = user.UserName;
            Roles = roles ?? new String[0];
            CreationDate = user.CreationDate;
            LastPasswordChangedDate = user.LastPasswordChangedDate;
        }

        public bool IsAuthenticated { get; set; }
        public String UserName { get; set; }
        public String[] Roles { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime LastPasswordChangedDate { get; set; }
    }

    public class LogonResponseModel : AuthenticatedUserModel
    {
        public LogonResponseModel()
        {
        }
        public LogonResponseModel(MembershipUser user)
            : base(user)
        {
        }
        public LogonResponseModel(String error)
        {
            Error = error;
        }
        public String Error { get; set; }
    }

    public class ChangePasswordModel
    {
        [Required]
        public String OldPassword { get; set; }
        [Required]
        public String NewPassword { get; set; }
    }

    public class ChangePasswordResponse
    {
        public bool Success { get; set; }
        public String Error { get; set; }
    }
}