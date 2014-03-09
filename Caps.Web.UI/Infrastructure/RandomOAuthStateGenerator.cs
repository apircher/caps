using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    public static class RandomOAuthStateGenerator
    {
        static RandomNumberGenerator _random = new RNGCryptoServiceProvider();

        public static String Generate(int strengthInBits)
        {
            const int bitsPerByte = 8;

            if (strengthInBits % bitsPerByte != 0)
            {
                throw new ArgumentException("\"strengthInBits\" muss ohne Rest durch 8 teilbar sein.", "strengthInBits");
            }

            int strengthInBytes = strengthInBits / bitsPerByte;

            byte[] data = new byte[strengthInBytes];
            _random.GetBytes(data);
            return HttpServerUtility.UrlTokenEncode(data);
        }
    }
}