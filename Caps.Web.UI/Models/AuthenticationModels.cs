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

    public class AuthenticatedUserModel
    {
        public AuthenticatedUserModel()
        {
        }
        public AuthenticatedUserModel(String loginProvider, String providerKey, String userName, String[] roles, Author author, bool hasRegistered)
        {
            if (author != null)
            {
                IsAuthenticated = true;
                UserName = userName;
                Roles = roles;
                CreationDate = author.CreationDate;
                LastPasswordChangedDate = author.LastPasswordChangedDate.GetValueOrDefault(author.CreationDate);

                FirstName = author.FirstName;
                LastName = author.LastName;
            }
            else
                UserName = userName;

            HasRegistered = hasRegistered;
            LoginProvider = loginProvider;
        }

        public bool IsAuthenticated { get; set; }
        public String UserName { get; set; }
        public String[] Roles { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime LastPasswordChangedDate { get; set; }

        public String FirstName { get; set; }
        public String LastName { get; set; }

        public bool HasRegistered { get; set; }
        public String LoginProvider { get; set; }
    }

    public class AccountManagementModel
    {
        public String LocalLoginProvider { get; set; }
        public String UserName { get; set; }
        public IEnumerable<AuthorLoginInfoModel> Logins { get; set; }
        public IEnumerable<ExternalLoginModel> LoginProviders { get; set; }
    }

    public class AuthorLoginInfoModel
    {
        public String LoginProvider { get; set; }
        public String ProviderKey { get; set; }
    }

    public class ExternalLoginModel
    {
        public String Name { get; set; }
        public String Url { get; set; }
        public String State { get; set; }
    }

    public class AddExternalLoginModel
    {
        [Required]
        [Display(Name = "Externes Zugriffstoken")]
        public String ExternalAccessToken { get; set; }
    }

    public class RemoveLoginModel
    {
        [Required]
        [Display(Name = "Anmeldeanbieter")]
        public String LoginProvider { get; set; }

        [Required]
        [Display(Name = "Anbieterschlüssel")]
        public String ProviderKey { get; set; }
    }

    public class ChangePasswordModel
    {
        [Required]
        [DataType(DataType.Password)]
        [Display(Name="Aktuelles Passwort")]
        public String OldPassword { get; set; }

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

    public class SetLocalPasswordModel
    {
        [Required]
        [StringLength(100, ErrorMessage = "\"{0}\" muss mindestens {2} Zeichen lang sein.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "Neues Passwort")]
        public string NewPassword { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Neues Passwort bestätigen")]
        [Compare("NewPassword", ErrorMessage = "Das neue Passwort stimmt nicht mit dem Bestätigungspasswort überein.")]
        public string ConfirmPassword { get; set; }
    }
}