using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Localization
{
    public interface ILocalizableEntity<T> where T : ILocalizedResource
    {
        IEnumerable<T> Resources { get; }
    }

    public interface ILocalizedResource
    {
        String Language { get; }
    }
}
