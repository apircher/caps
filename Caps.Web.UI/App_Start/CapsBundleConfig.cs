﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace Caps.Web.UI
{
    public class CapsBundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.IgnoreList.Clear();
            AddDefaultIgnorePatterns(bundles.IgnoreList);

            bundles.Add(
              new StyleBundle("~/Content/vendor-styles")
                .Include("~/Content/bootstrap.css")
                .Include("~/Content/font-awesome.css")
                .Include("~/Content/toastr.css")
                .Include("~/Content/typeahead.css")
                .Include("~/Scripts/codemirror/lib/codemirror.css")
                .Include("~/Content/durandal.css")
              );

            bundles.Add(
              new StyleBundle("~/Content/app-styles")
                .Include("~/Content/app-theme.css")
                .Include("~/Content/app-drafts-editor.css")
                .Include("~/Content/app-splash.css")
              );

            bundles.Add(
              new ScriptBundle("~/Scripts/vendor")
                .Include("~/Scripts/jquery-2.1.1.js")
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
                .Include("~/Scripts/codemirror/lib/codemirror.js")
                .Include("~/Scripts/codemirror/mode/javascript/javascript.js")
                .Include("~/Scripts/codemirror/mode/xml/xml.js")
                .Include("~/Scripts/codemirror/mode/css/css.js")
                .Include("~/Scripts/codemirror/mode/htmlmixed/htmlmixed.js")
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