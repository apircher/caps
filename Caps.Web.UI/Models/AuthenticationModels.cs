using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Caps.Web.UI.Models
{
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
        public AuthenticatedUserModel(bool isAuthenticated, String userName, String[] roles = null)
        {
            IsAuthenticated = isAuthenticated;
            UserName = userName;
            Roles = roles ?? new String[0];
        }

        public bool IsAuthenticated { get; set; }
        public String UserName { get; set; }
        public String[] Roles { get; set; }
    }

    public class LogonResponseModel : AuthenticatedUserModel
    {
        public LogonResponseModel()
        {
        }
        public LogonResponseModel(bool isAuthenticated, String userName)
            : base(isAuthenticated, userName)
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