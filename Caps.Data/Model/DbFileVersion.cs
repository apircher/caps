using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Model
{
    public class DbFileVersion
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        [Required]
        public int FileId { get; set; }
        public int FileSize { get; set; }

        [MaxLength(20)]
        public byte[] Hash { get; set; }

        public String Notes { get; set; }

        [InverseProperty("Versions"), ForeignKey("FileId")]
        public DbFile File { get; set; }
        [InverseProperty("FileVersion")]
        public DbFileContent Content { get; set; }
        [InverseProperty("FileVersion")]
        public ICollection<DbFileProperty> Properties { get; set; }
        [InverseProperty("FileVersion")]
        public ICollection<DbThumbnail> Thumbnails { get; set; }
        [InverseProperty("FileVersion")]
        public ICollection<PublicationFileResource> PublicationFileResources { get; set; }
        [InverseProperty("FileVersion")]
        public ICollection<DraftFileResource> DraftFileResources { get; set; }
        [InverseProperty("PictureFileVersion")]
        public ICollection<DbSiteMapNodeResource> SiteMapNodeResources { get; set; }

        public ChangeInfo Created { get; set; }
        public ChangeInfo Modified { get; set; }

        public void AddProperty(String propertyName, object value)
        {
            if (Properties == null)
                Properties = new List<DbFileProperty>();

            var prop = FindPropertyByName(propertyName);
            if (prop != null)
                throw new InvalidOperationException("A property with the name " + propertyName + " has already been added.");

            Properties.Add(new DbFileProperty { FileVersion = this, PropertyName = propertyName, PropertyValue = value.ToString() });
        }
        public void AddOrSetProperty(String propertyName, object value)
        {
            var prop = FindPropertyByName(propertyName);
            if (prop != null)
                prop.PropertyValue = value.ToString();
            else
                AddProperty(propertyName, value);
        }

        DbFileProperty FindPropertyByName(String propertyName)
        {
            if (Properties == null)
                return null;
            return Properties.FirstOrDefault(p => String.Equals(p.PropertyName, propertyName, StringComparison.OrdinalIgnoreCase));
        }
    }
}
