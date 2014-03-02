using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using System.Web.Security;
using Caps.Web.UI.Infrastructure;

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
        public AuthenticatedUserModel(Author author)
        {
            if (author != null)
            {
                IsAuthenticated = true;
                UserName = author.UserName;
                Roles = author.GetRoles();
                CreationDate = author.CreationDate;
                LastPasswordChangedDate = author.LastPasswordChangedDate.GetValueOrDefault(author.CreationDate);

                FirstName = author.FirstName;
                LastName = author.LastName;
            }
        }

        public bool IsAuthenticated { get; set; }
        public String UserName { get; set; }
        public String[] Roles { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime LastPasswordChangedDate { get; set; }

        public String FirstName { get; set; }
        public String LastName { get; set; }
    }

    public class LogonResponseModel : AuthenticatedUserModel
    {
        public LogonResponseModel() 
        {
        }
        public LogonResponseModel(Author author)
            : base(author) 
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