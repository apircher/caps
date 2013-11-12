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
                    resource = draftFile.getResource(language),
                    fileVersion = resource != null ? resource.FileVersion() : undefined;
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

    function TemplateContentCell(partType, title, colspan, content) {
        var self = this;

        self.partType = partType;
        self.title = title;
        self.colspan = colspan;
        self.content = content;
    }

    function createTemplateContent(draft, language) {
        var template = draft.deserializeTemplate();
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
    
    var markdownConverter = undefined;
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
            templateContent: draft.TemplateContent(),

            created: prepareChangeInfo(draft.Created()),
            modified: prepareChangeInfo(draft.Modified()),

            resources: prepareResources(draft.Resources()),
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

    function prepareResources(resources) {
        return ko.utils.arrayMap(resources, function (resource) {
            return {
                language: resource.Language(),
                title: resource.Title(),
                keywords: resource.Keywords(),
                description: resource.Description(),
                created: prepareChangeInfo(resource.Created()),
                modified: prepareChangeInfo(resource.Modified())
            };
        });
    }

    function prepareContentParts(draft) {
        return ko.utils.arrayMap(draft.ContentParts(), function (contentPart) {
            return {
                partType: contentPart.PartType(),
                contentType: contentPart.ContentType(),
                ranking: contentPart.Ranking(),
                resources: prepareContentPartResources(draft, contentPart.Resources())
            };
        });
    }

    function prepareContentPartResources(draft, resources) {
        return ko.utils.arrayMap(resources, function (resource) {
            var transformedContent = generateContent(resource, resource.Language());
            return {
                language: resource.Language(),
                content: transformedContent,
                created: prepareChangeInfo(resource.Created()),
                modified: prepareChangeInfo(resource.Modified())
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