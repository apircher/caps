using Microsoft.AspNet.Identity.EntityFramework;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Caps.Data.Utils;
using System.Security.Claims;
using Microsoft.AspNet.Identity;

namespace Caps.Data.Model
{
    [Table("Author")]
    public class Author : IdentityUser
    {
        [MaxLength(50), Required]
        public String FirstName { get; set; }
        [MaxLength(50), Required]
        public String LastName { get; set; }

        [DateTimeKind(DateTimeKind.Utc)]
        public DateTime CreationDate { get; set; }
        public DateTime? LastLoginDate { get; set; }
        [DateTimeKind(DateTimeKind.Utc)]
        public DateTime? LastActivityDate { get; set; }
        public DateTime? LastPasswordChangedDate { get; set; }
        public DateTime? LastLockoutDate { get; set; }
        public DateTime? LastPasswordFailureDate { get; set; }
        public int PasswordFailuresSinceLastSuccess { get; set; }
        public String Comment { get; set; }

        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<Author> manager)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, DefaultAuthenticationTypes.ApplicationCookie);
            // Add custom user claims here
            return userIdentity;
        }
    }
}
