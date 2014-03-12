using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Caps.Consumer.Model;

namespace Caps.Web.UI.Infrastructure
{
    public static class Dto
    {
        public static Website Create(Caps.Data.Model.Website model)
        {
            return new Website
            {
                Id = model.Id,
                Name = model.Name,
                Url = model.Url
            };
        }

        public static PublicationTranslation Create(Caps.Data.Model.PublicationTranslation model)
        {
            if (model == null) return null;
            return new PublicationTranslation
            {
                PublicationId = model.PublicationId,
                Language = model.Language,
                ContentVersion = model.ContentVersion,
                ContentDate = model.ContentDate,
                AuthorName = model.AuthorName
            };
        }
        public static ICollection<PublicationTranslation> CreateCollection(ICollection<Caps.Data.Model.PublicationTranslation> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }
        
        public static PublicationFileResource Create(Caps.Data.Model.PublicationFileResource model)
        {
            if (model == null) return null;
            return new PublicationFileResource
            {
                PublicationFileId = model.PublicationFileId,
                Language = model.Language,
                DbFileVersionId = model.DbFileVersionId,
                Title = model.Title,
                Description = model.Description,
                Credits = model.Credits,
                FileVersion = Create(model.FileVersion)
            };
        }
        public static ICollection<PublicationFileResource> CreateCollection(ICollection<Caps.Data.Model.PublicationFileResource> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static PublicationFile Create(Caps.Data.Model.PublicationFile model)
        {
            if (model == null) return null;
            return new PublicationFile
            {
                Id = model.Id,
                PublicationId = model.PublicationId,
                Name = model.Name,
                IsEmbedded = model.IsEmbedded,
                Determination = model.Determination,
                Group = model.Group,
                Ranking = model.Ranking,
                Resources = CreateCollection(model.Resources)
            };
        }
        public static ICollection<PublicationFile> CreateCollection(ICollection<Caps.Data.Model.PublicationFile> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static Publication Create(Caps.Data.Model.Publication model)
        {
            if (model == null) return null;
            return new Publication
            {
                Id = model.Id,
                EntityType = model.EntityType,
                EntityKey = model.EntityKey,
                ContentVersion = model.ContentVersion,
                ContentDate = model.ContentDate,
                AuthorName = model.AuthorName,
                Template = model.Template,
                Properties = model.Properties,
                ContentParts = CreateCollection(model.ContentParts),
                Files = CreateCollection(model.Files),
                Translations = CreateCollection(model.Translations)
            };
        }

        public static PublicationContentPartResource Create(Caps.Data.Model.PublicationContentPartResource model)
        {
            if (model == null) return null;
            return new PublicationContentPartResource
            {
                PublicationContentPartId = model.PublicationContentPartId,
                Language = model.Language,
                Content = model.Content
            };
        }
        public static ICollection<PublicationContentPartResource> CreateCollection(ICollection<Caps.Data.Model.PublicationContentPartResource> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static PublicationContentPart Create(Caps.Data.Model.PublicationContentPart model)
        {
            if (model == null) return null;
            return new PublicationContentPart
            {
                Id = model.Id,
                PublicationId = model.PublicationId,
                ContentType = model.ContentType,
                Properties = model.Properties,
                Ranking = model.Ranking,
                Name = model.Name,
                Resources = CreateCollection(model.Resources)
            };
        }
        public static ICollection<PublicationContentPart> CreateCollection(ICollection<Caps.Data.Model.PublicationContentPart> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static DraftTemplate Create(Caps.Data.Model.DraftTemplate model)
        {
            if (model == null) return null;
            return new DraftTemplate
            {
                Id = model.Id,
                Name = model.Name,
                WebsiteId = model.WebsiteId,
                Description = model.Description,
                TemplateContent = model.TemplateContent
            };
        }

        public static DbSiteMapNodeResource Create(Caps.Data.Model.DbSiteMapNodeResource model)
        {
            if (model == null) return null;
            return new DbSiteMapNodeResource
            {
                SiteMapNodeId = model.SiteMapNodeId,
                Language = model.Language,
                Title = model.Title,
                Keywords = model.Keywords,
                Description = model.Description
            };
        }
        public static ICollection<DbSiteMapNodeResource> CreateCollection(ICollection<Caps.Data.Model.DbSiteMapNodeResource> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static DbSiteMapNode Create(Caps.Data.Model.DbSiteMapNode model)
        {
            if (model == null) return null;
            return new DbSiteMapNode
            {
                Id = model.Id,
                SiteMapId = model.SiteMapId,
                ParentNodeId = model.ParentNodeId,
                ContentId = model.ContentId,
                PermanentId = model.PermanentId,
                Name = model.Name,
                Ranking = model.Ranking,
                NodeType = model.NodeType,
                IsDeleted = model.IsDeleted,
                Redirect = model.Redirect,
                RedirectType = model.RedirectType,
                ActionUrl = model.ActionUrl,
                Created = Create(model.Created),
                Modified = Create(model.Modified),
                ChildNodes = CreateCollection(model.ChildNodes),
                Resources = CreateCollection(model.Resources),
                Content = Create(model.Content)
            };
        }
        public static ICollection<DbSiteMapNode> CreateCollection(ICollection<Caps.Data.Model.DbSiteMapNode> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static DbSiteMap Create(Caps.Data.Model.DbSiteMap model)
        {
            if (model == null) return null;
            return new DbSiteMap
            {
                Id = model.Id,
                WebsiteId = model.WebsiteId,
                Version = model.Version,
                PublishedFrom = model.PublishedFrom,
                PublishedBy = model.PublishedBy,
                SiteMapNodes = CreateCollection(model.SiteMapNodes)
            };
        }

        public static ChangeInfo Create(Caps.Data.Model.ChangeInfo model)
        {
            if (model == null) return null;
            return new ChangeInfo
            {
                By = model.By,
                At = model.At
            };
        }

        public static DbFileVersion Create(Caps.Data.Model.DbFileVersion model)
        {
            if (model == null) return null;
            return new DbFileVersion
            {
                Id = model.Id,
                FileId = model.FileId,
                FileSize = model.FileSize,
                Hash = model.Hash,
                Notes = model.Notes,
                File = Create(model.File),
                Content = Create(model.Content),
                Properties = CreateCollection(model.Properties),
                Created = Create(model.Created),
                Modified = Create(model.Modified)
            };
        }

        public static DbFile Create(Caps.Data.Model.DbFile model)
        {
            if (model == null) return null;
            return new DbFile
            {
                Id = model.Id,
                FileName = model.FileName,
                ContentType = model.ContentType,
                Tags = CreateCollection(model.Tags),
                Created = Create(model.Created),
                Modified = Create(model.Modified)
            }; 
        }

        public static DbFileContent Create(Caps.Data.Model.DbFileContent model)
        {
            if (model == null) return null;
            return new DbFileContent
            {
                FileVersionId = model.FileVersionId,
                Data = model.Data
            };
        }

        public static DbFileProperty Create(Caps.Data.Model.DbFileProperty model)
        {
            if (model == null) return null;
            return new DbFileProperty
            {
                FileVersionId = model.FileVersionId,
                PropertyName = model.PropertyName,
                PropertyValue = model.PropertyValue
            };
        }
        public static ICollection<DbFileProperty> CreateCollection(ICollection<Caps.Data.Model.DbFileProperty> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static DbFileTag Create(Caps.Data.Model.DbFileTag model)
        {
            if (model == null) return null;
            return new DbFileTag
            {
                FileId = model.FileId,
                TagId = model.TagId,
                Tag = Create(model.Tag)
            };
        }
        public static ICollection<DbFileTag> CreateCollection(ICollection<Caps.Data.Model.DbFileTag> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static Tag Create(Caps.Data.Model.Tag model)
        {
            if (model == null) return null;
            return new Tag
            {
                Id = model.Id,
                Name = model.Name
            };
        }
        public static ICollection<Tag> CreateCollection(ICollection<Caps.Data.Model.Tag> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }

        public static DbThumbnail Create(Caps.Data.Model.DbThumbnail model)
        {
            if (model == null) return null;
            return new DbThumbnail
            {
                Id = model.Id,
                FileVersionId = model.FileVersionId,
                OriginalFileHash = model.OriginalFileHash,
                ContentType = model.ContentType,
                Name = model.Name,
                Width = model.Width,
                Height = model.Height,
                Data = model.Data
            };
        }
        public static ICollection<DbThumbnail> CreateCollection(ICollection<Caps.Data.Model.DbThumbnail> models)
        {
            if (models == null) return null;
            return models.Select(m => Create(m)).ToList();
        }
    }
}