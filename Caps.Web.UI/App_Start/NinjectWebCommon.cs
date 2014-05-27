[assembly: WebActivator.PreApplicationStartMethod(typeof(Caps.Web.UI.App_Start.NinjectWebCommon), "Start")]
[assembly: WebActivator.ApplicationShutdownMethodAttribute(typeof(Caps.Web.UI.App_Start.NinjectWebCommon), "Stop")]

namespace Caps.Web.UI.App_Start
{
    using System;
    using System.Web;

    using Microsoft.Web.Infrastructure.DynamicModuleHelper;

    using Ninject;
    using Ninject.Web.Common;
    using Microsoft.AspNet.Identity;
    using Microsoft.AspNet.Identity.EntityFramework;
    using Caps.Data;

    public static class NinjectWebCommon 
    {
        private static readonly Bootstrapper bootstrapper = new Bootstrapper();

        /// <summary>
        /// Starts the application
        /// </summary>
        public static void Start() 
        {
            DynamicModuleUtility.RegisterModule(typeof(OnePerRequestHttpModule));
            DynamicModuleUtility.RegisterModule(typeof(NinjectHttpModule));
            bootstrapper.Initialize(CreateKernel);
        }
        
        /// <summary>
        /// Stops the application.
        /// </summary>
        public static void Stop()
        {
            bootstrapper.ShutDown();
        }
        
        /// <summary>
        /// Creates the kernel that will manage your application.
        /// </summary>
        /// <returns>The created kernel.</returns>
        private static IKernel CreateKernel()
        {
            var kernel = new StandardKernel();
            kernel.Bind<Func<IKernel>>().ToMethod(ctx => () => new Bootstrapper().Kernel);
            kernel.Bind<IHttpModule>().To<HttpApplicationInitializationHttpModule>();

            RegisterServices(kernel);
            return kernel;
        }

        /// <summary>
        /// Load your modules or register your services here!
        /// </summary>
        /// <param name="kernel">The kernel.</param>
        private static void RegisterServices(IKernel kernel)
        {
            kernel.Bind<CapsDbContext>().ToSelf().InRequestScope();

            kernel.Bind<IUserStore<Caps.Data.Model.Author>>()
                .ToConstructor(u => new UserStore<Caps.Data.Model.Author>(kernel.Get<CapsDbContext>()))
                .InRequestScope();

            kernel.Bind<IRoleStore<IdentityRole, string>>()
                .ToConstructor(u => new RoleStore<IdentityRole>(kernel.Get<CapsDbContext>()))
                .InRequestScope();

            kernel.Bind<Caps.Web.UI.Controllers.IAntiForgeryTokenProvider>().To<Caps.Web.UI.Controllers.DefaultAntiForgeryTokenProvider>();
        }        
    }
}
