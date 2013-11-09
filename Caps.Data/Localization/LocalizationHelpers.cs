using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Localization
{
    public static class LocalizationHelpers
    {
        public static TResource GetLocalizedResource<TResource>(this ILocalizableEntity<TResource> entity, String language)
            where TResource : ILocalizedResource
        {
            return entity.Resources.FirstOrDefault(r => String.Equals(r.Language, language, StringComparison.InvariantCultureIgnoreCase));
        }
        public static bool HasLocalizedResource<TResource>(this ILocalizableEntity<TResource> entity, String language)
            where TResource : ILocalizedResource
        {
            return entity.Resources.Any(r => String.Equals(r.Language, language, StringComparison.InvariantCultureIgnoreCase));
        }

        public static TValue GetValueForLanguage<TValue, TResource>(this ILocalizableEntity<TResource> entity, String language,
            Func<TResource, TValue> expression, TValue defaultValue, params String[] fallbackLanguages)
            where TResource : ILocalizedResource
        {
            TResource res = (TResource)entity.GetLocalizedResource(language);
            if (res == null || expression(res) == null)
            {
                if (fallbackLanguages.Length == 0)
                    return defaultValue;
                else
                    res = fallbackLanguages.Where(l => entity.HasLocalizedResource(l))
                        .Select(l => (TResource)entity.GetLocalizedResource(l)).FirstOrDefault();
            }

            return res != null ? expression(res) : defaultValue;
        }
    }
}
