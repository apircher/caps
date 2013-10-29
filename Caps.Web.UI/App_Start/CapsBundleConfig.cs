using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace Caps.Web.UI.App_Start
{
    public class CapsBundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.IgnoreList.Clear();
            AddDefaultIgnorePatterns(bundles.IgnoreList);
            
            bundles.Add(
              new StyleBundle("~/Content/css")
                .Include("~/Content/bootstrap/bootstrap.min.css")
                .Include("~/Content/bootstrap/bootstrap-theme.min.css")
                .Include("~/Content/fontawesome/font-awesome.min.css")
                .Include("~/Content/durandal.css")
                .Include("~/Content/app.css")
                .Include("~/Content/ie10mobile.css")
                .Include("~/Content/toastr.css")
              );

        }

        public static void AddDefaultIgnorePatterns(IgnoreList ignoreList)
        {
            if (ignoreList == null)
            {
                throw new ArgumentNullException("ignoreList");
            }

            ignoreList.Ignore("*.intellisense.js");
            ignoreList.Ignore("*-vsdoc.js");
            ignoreList.Ignore("*.debug.js", OptimizationMode.WhenEnabled);
            //ignoreList.Ignore("*.min.js", OptimizationMode.WhenDisabled);
            //ignoreList.Ignore("*.min.css", OptimizationMode.WhenDisabled);
        }
    }
}