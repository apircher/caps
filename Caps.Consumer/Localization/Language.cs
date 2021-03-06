﻿using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Localization
{
    public static class Language
    {
        static String[] supportedLanguages = new String[] { "de", "en" };
        static Dictionary<String, String> languageTitles = new Dictionary<String, String>
        {
            { "de", "Deutsch" },
            { "en", "English" }
        };
        static Dictionary<String, String> languageCultures = new Dictionary<String, String>
        {
            { "de", "de-DE" },
            { "en", "en-US" }
        };
        static Dictionary<String, String> switchStatements = new Dictionary<String, String>
        {
            { "de", "Auf Deutsch anzeigen" },
            { "en", "Display in English" }
        };
        const String defaultCulture = "de-DE";
        const String defaultLanguage = "de";

        public static IQueryable<String> SupportedLanguages { get { return supportedLanguages.AsQueryable(); } }
        public static String LanguageTitle(String language)
        {
            if (String.IsNullOrWhiteSpace(language))
                return String.Empty;

            String s = language.ToLower(CultureInfo.InvariantCulture);
            return languageTitles.ContainsKey(s) ? languageTitles[s] : String.Empty;
        }
        public static String LanguageCulture(String language)
        {
            if (String.IsNullOrWhiteSpace(language))
                return defaultCulture;

            String s = language.ToLower(CultureInfo.InvariantCulture);
            return languageCultures.ContainsKey(s) ? languageCultures[s] : defaultCulture;
        }
        public static String SwitchStatement(String language)
        {
            if (String.IsNullOrWhiteSpace(language))
                return String.Empty;

            String s = language.ToLower(CultureInfo.InvariantCulture);
            return switchStatements.ContainsKey(s) ? switchStatements[s] : String.Empty;
        }

        public static String LanguageTitle(this ILocalizedResource resource)
        {
            if (resource == null)
                throw new ArgumentNullException("resource");
            return LanguageTitle(resource.Language);
        }

        public static String CultureToLanguage(String cultureCode)
        {
            var language = languageCultures.Where(p => String.Equals(cultureCode, p.Value, StringComparison.InvariantCultureIgnoreCase))
                .Select(p => p.Key)
                .FirstOrDefault();
            if (String.IsNullOrWhiteSpace(language))
                return defaultLanguage;
            return language;
        }

        public static String CurrentLanguage
        {
            get
            {
                String cultureCode = System.Threading.Thread.CurrentThread.CurrentUICulture.Name;
                return CultureToLanguage(cultureCode);
            }
        }

        public static String DefaultLanguage
        {
            get
            {
                return defaultLanguage;
            }
        }
    }
}
