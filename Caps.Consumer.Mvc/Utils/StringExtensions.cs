using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Caps.Consumer.Mvc.Utils
{
    public static class StringExtensions
    {
        /// <summary>
        /// Gibt eine Zeichenfolge zurück, die als Teil einer URL verwendet werden kann.
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1055:UriReturnValuesShouldNotBeStrings",
            Justification = "Die Methode gibt keine komplette Url zurück.")]
        public static String UrlEncode(this String value)
        {
            if (value == null)
                throw new ArgumentNullException("value");

            // make it all lower case
            value = value.ToLower(CultureInfo.CurrentCulture).Trim();
            // remove entities
            value = Regex.Replace(value, @"&\w+;", "");
            // replace german umlauts
            value = Regex.Replace(value, "ü", "ue");
            value = Regex.Replace(value, "ö", "oe");
            value = Regex.Replace(value, "ä", "ae");
            // replace dividers
            value = Regex.Replace(value, @"[/\ ]", "-");
            // remove anything that is not letters, numbers, dash, or space
            value = Regex.Replace(value, @"[^a-z0-9\-\s]", "");
            // replace spaces
            value = value.Replace(' ', '-');
            // collapse dashes
            value = Regex.Replace(value, @"-{2,}", "-");
            // trim excessive dashes at the beginning
            value = value.TrimStart(new[] { '-' });
            // if it's too long, clip it
            if (value.Length > 80)
                value = value.Substring(0, 79);
            // remove trailing dashes
            value = value.TrimEnd(new[] { '-' });

            return value;
        }
    }
}
