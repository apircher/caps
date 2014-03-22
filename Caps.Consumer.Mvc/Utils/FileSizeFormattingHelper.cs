using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Mvc.Utils
{
    public static class FileSizeFormattingHelper
    {
        static String[] units = { "Byte", "KB", "MB", "GB" };
        public static String FormattedFileSize(this int sizeInBytes)
        {
            double size = sizeInBytes;
            var unitIndex = 0;
            while (size > 1024 && unitIndex < units.Length - 1)
            {
                size /= 1024.0;
                unitIndex++;
            }
            return String.Format("{0:0.##} {1}", size, units[unitIndex]);
        }
    }
}
