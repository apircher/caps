﻿[assembly: WebActivator.PreApplicationStartMethod(typeof(Caps.Web.UI.App_Start.CapsDbInitializer), "InitializeDatabase")]

namespace Caps.Web.UI.App_Start
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Web;
    using WebMatrix.WebData;

    public static class CapsDbInitializer
    {
        static void InitializeDatabase()
        {
#if DEBUG
            System.Data.Entity.Database.SetInitializer<Caps.Data.CapsDbContext>(
                new System.Data.Entity.DropCreateDatabaseIfModelChanges<Caps.Data.CapsDbContext>());
#endif
            try
            {
                using (var context = new Caps.Data.CapsDbContext())
                {
                    context.Database.CreateIfNotExists();
                    context.Database.Initialize(false);
                }
            }
            catch (Exception ex)
            {
                throw new CapsDbInitializerException("Die Datenbank konnte nicht initialisiert werden.", ex);
            }
        }
        
        public static void InitializeWebSecurity()
        {
            try
            {
                WebSecurity.InitializeDatabaseConnection("CapsDbContext", "Author", "Id", "UserName", true);
                RolesConfig.EnsureDefaultRoles();
                RolesConfig.EnsureUserInRole("Administrator");
            }
            catch (Exception ex)
            {
                throw new CapsDbInitializerException("Die ASP.NET Simple Membership-Datenbank konnte nicht initialisiert werden.", ex);
            }
        }
    }

    public class CapsDbInitializerException : Exception
    {
        public CapsDbInitializerException()
            : base() 
        {
        }
        public CapsDbInitializerException(String message)
            : base(message) 
        {
        }
        public CapsDbInitializerException(String message, Exception innerException)
            : base(message, innerException) 
        {
        }
    }
}