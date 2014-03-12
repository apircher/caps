using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Consumer.Model
{    
    /// <summary>
    /// Represents an associated file in a ContentModel-Instance.
    /// </summary>
    public class ContentFileModel
    {
        /// <summary>
        /// The name of the associated file.
        /// </summary>
        public String Name { get; set; }
        /// <summary>
        /// The language of the associated file.
        /// </summary>
        public String Language { get; set; }
        /// <summary>
        /// The determination of the associated file.
        /// </summary>
        public String Determination { get; set; }
        /// <summary>
        /// The group of the associated file.
        /// </summary>
        public String Group { get; set; }
        /// <summary>
        /// The ranking of the assicated file.
        /// </summary>
        public int Ranking { get; set; }

        /// <summary>
        /// The title of the associated file.
        /// </summary>
        public String Title { get; set; }
        /// <summary>
        /// The description of the assicated file.
        /// </summary>
        public String Description { get; set; }

        /// <summary>
        /// The id of the associated files version.
        /// </summary>
        public int FileVersionId { get; set; }
        /// <summary>
        /// The actual file name.
        /// </summary>
        public String FileName { get; set; }
    }
}
