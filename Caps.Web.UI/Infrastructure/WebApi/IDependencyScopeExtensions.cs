using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http.Dependencies;

namespace Caps.Web.UI.Infrastructure.WebApi
{
    public static class IDependencyScopeExtensions
    {
        public static T GetService<T>(this IDependencyScope scope)
        {
            return (T)scope.GetService(typeof(T));
        }
    }
}