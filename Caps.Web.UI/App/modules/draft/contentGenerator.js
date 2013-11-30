/*
 * contentGenerator.js
 * Provides functions to prepare draft contents for publication.
 */
define([
    'ko',
    'markdown',
    'infrastructure/urlHelper',
    'infrastructure/contentReferences'
],
function (ko, markdown, urlHelper, ContentReferenceManager) {

    var crmgr = new ContentReferenceManager({
            replaceFileReference: function (reference, language, context) {
                var draft = reference.context,
                    draftFile = draft.findDraftFile(reference.fileName),
                    resource = draftFile ? draftFile.getResource(language) : undefined,
                    fileVersion = resource ? resource.FileVersion() : undefined;
                if (!fileVersion) return '';
                return urlHelper.getFileUrl(reference.fileName, fileVersion, reference.query);
            },

            replacePublicationReference: function (reference, language, context) {
                return urlHelper.getPublicationUrl(reference.id, language, reference.query);
            }
        });

    /*
     * Template Content
     */

    function TemplateContent(name, rows) {
        var self = this;

        self.name = name;
        self.rows = rows;
    }

    function TemplateContentRow(cells) {
        var self = this;

        self.cells = cells;
    }

    function TemplateContentCell(name, title, colspan, content) {
        var self = this;

        self.name = name;
        self.title = title;
        self.colspan = colspan;
        self.content = content;
    }

    function createTemplateContent(draft, language) {
        var template = draft.deserializeTemplate();
        if (!template) return new TemplateContent();

        return new TemplateContent(template.name, ko.utils.arrayMap(template.rows, function (row) {
            return new TemplateContentRow(ko.utils.arrayMap(row.cells, function (cell) {
                var content = generateLocalizedContentForTemplateCell(draft, cell, language);
                content = crmgr.replaceReferences(draft, content, language);
                return new TemplateContentCell(cell.name, cell.title, cell.colspan, content);
            }));
        }));
    }

    function generateLocalizedContentForTemplateCell(draft, templateCell, language) {
        var contentPart = draft.findContentPart(templateCell.name);
        if (contentPart)
            return generateLocalizedContent(contentPart, language);
        return '';
    }

    function generateLocalizedContent(contentPart, language) {
        var resource = contentPart.getResource(language);
        return generateContent(resource, language);
    }

    function generateContent(resource, language) {
        var result = resource.Content(),
            contentPart = resource.ContentPart();
        result = transformContent(contentPart.ContentType(), result);
        return result;
    }
    
    var markdownConverter;
    function transformContent(contentType, content) {
        if (contentType.toLowerCase() === 'markdown') {
            markdownConverter = markdownConverter || new Markdown.Converter();
            return markdownConverter.makeHtml(content);
        }
        if (contentType.toLowerCase() === 'text') {
            return '<pre>' + content + '</pre>';
        }
        return content;
    }

    /*
     * Publication Content
     */
    function prepareDraft(draft) {
        return {
            entityType: 'Draft',
            entityId: draft.Id(),
            version: draft.Version(),

            name: draft.Name(),
            template: draft.Template(),

            created: prepareChangeInfo(draft.Created()),
            modified: prepareChangeInfo(draft.Modified()),

            resources: prepareResources(draft),
            contentParts: prepareContentParts(draft),
            files: prepareFiles(draft)
        };
    }

    function prepareChangeInfo(changeInfo) {
        return {
            at: changeInfo.At(),
            by: changeInfo.By()
        };
    }

    function prepareResources(draft) {
        var resources = ko.utils.arrayMap(draft.Translations(), function (translation) {
            return {
                language: translation.Language(),
                title: translation.TranslatedName(),
                created: prepareChangeInfo(translation.Created()),
                modified: prepareChangeInfo(translation.Modified())
            };
        });
        resources.push({
            language: draft.OriginalLanguage(),
            title: draft.Name(),
            created: prepareChangeInfo(draft.Created()),
            modified: prepareChangeInfo(draft.Modified())
        });
        return resources;
    }

    function prepareContentParts(draft) {
        return ko.utils.arrayMap(draft.ContentParts(), function (contentPart) {
            return {
                name: contentPart.Name(),
                contentType: contentPart.ContentType(),
                ranking: contentPart.Ranking(),
                resources: prepareContentPartResources(draft, contentPart.Resources())
            };
        });
    }

    function prepareContentPartResources(draft, resources) {
        return ko.utils.arrayMap(resources, function (resource) {
            return {
                language: resource.Language(),
                content: generateContent(resource, resource.Language())
            };
        });
    }

    function prepareFiles(draft) {
        return ko.utils.arrayMap(draft.Files(), function (file) {
            return {
                name: file.Name(),
                isEmbedded: file.IsEmbedded(),
                determination: file.Determination(),
                group: file.Group(),
                ranking: file.Ranking(),
                resources: prepareFileResources(file.Resources())
            };
        });
    }

    function prepareFileResources(resources) {
        return ko.utils.arrayMap(resources, function (resource) {
            return {
                language: resource.Language(),
                dbFileVersionId: resource.DbFileVersionId(),
                title: resource.Title(),
                description: resource.Description(),
                credits: resource.Credits()
            };
        });
    }


    return {
        TemplateContent: TemplateContent,
        TemplateContentRow: TemplateContentRow,
        TemplateContentCell: TemplateContentCell,

        createTemplateContent: createTemplateContent,
        createPublicationContent: prepareDraft
    };
});