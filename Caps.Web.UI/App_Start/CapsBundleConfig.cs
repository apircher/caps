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
                .Include("~/Content/durandal.css")
                .Include("~/Content/app.css")
                .Include("~/Content/app-drafts-editor.css")
                .Include("~/Content/ie10mobile.css")
                .Include("~/Content/toastr.css")
                .Include("~/Content/typeahead.css")
              );

            bundles.Add(
              new ScriptBundle("~/Scripts/vendor")
                .Include("~/Scripts/jquery-2.1.0.js")
                .Include("~/Scripts/jquery.fileupload.js")
                .Include("~/Scripts/jquery.ui.widget.js")
                .Include("~/Scripts/knockout-3.1.0.js")
                .Include("~/Scripts/knockout.validation.js")
                .Include("~/Scripts/bootstrap.js")
                .Include("~/Scripts/q.js")
                .Include("~/Scripts/breeze.min.js")
                .Include("~/Scripts/toastr.js")
                .Include("~/Scripts/Markdown.Converter.js")
                .Include("~/Scripts/Markdown.Editor.js")
                .Include("~/Scripts/typeahead.js")
                .Include("~/Scripts/knockout.custom-bindings.js")
                .Include("~/Scripts/string-extensions.js")
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