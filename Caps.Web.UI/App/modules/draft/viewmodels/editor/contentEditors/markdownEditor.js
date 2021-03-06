﻿/*global define, Markdown*/

define([
    'durandal/app',
    'ko',
    'jquery',
    './insertLinkDialog',
    './insertImageDialog',
    '../../../module',
    'Q'
],
function (app, ko, $, InsertLinkDialog, InsertImageDialog, module, Q) {

    function MarkdownContentEditor() {
        var self = this;

        self.insertLink = function (editorCallback) {
            var dlg = new InsertLinkDialog();
            app.showDialog(dlg).then(function (dialogResult) {
                if (dialogResult.result) {
                    editorCallback(dialogResult.url);
                }
                else
                    editorCallback(null);
            });
            return true;
        };

        self.insertPicture = function (editorCallback, selectedFile) {
            var dlg = new InsertImageDialog(self.editor, self.editor.entity(), selectedFile);
            app.showDialog(dlg).then(function (dialogResult) {
                if (dialogResult.result)
                    editorCallback(dialogResult.url);
                else {

                    if (dialogResult.addFiles) {
                        $('.wmd-prompt-background').hide();
                        app.selectFiles({
                            module: module,
                            title: 'Dateien zu Entwurf "' + self.editor.entity().Name() + '" hinzufügen'
                        }).then(function (result) {
                            if (result.dialogResult) {
                                var draftFilePromises = ko.utils.arrayMap(result.selectedFiles, function (file) {
                                    return self.editor.createDraftFile(file);
                                });
                                $('.wmd-prompt-background').show();
                                Q.all(draftFilePromises).then(function (results) {
                                    self.insertPicture(editorCallback, results[0]);
                                });
                            }
                            else
                                editorCallback(null);
                        });
                    }
                    else 
                        editorCallback(null);
                }
            });
            return true;
        };

        self.showHelp = function () {
            alert('help?');
        };

    }

    var markdownEditorButtonStrings = {
        bold: "Fett <strong> Ctrl+B",
        boldexample: "fetter Text",

        italic: "Hervorhebung <em> Ctrl+I",
        italicexample: "hervorgehobener Text",

        link: "Link <a> Ctrl+L",
        linkdescription: "Link-Text hier einfügen",
        linkdialog: "",

        quote: "Zitat <blockquote> Ctrl+Q",
        quoteexample: "Zitat",

        code: "Code Beispiel <pre><code> Ctrl+K",
        codeexample: "Code hier einfügen",

        image: "Bild <img> Ctrl+G",
        imagedescription: "Bild-Beschreibung hier einfügen",
        imagedialog: "",

        olist: "Nummerierte Liste <ol> Ctrl+O",
        ulist: "Liste <ul> Ctrl+U",
        litem: "Listen-Element",

        heading: "Überschrift <h1>/<h2> Ctrl+H",
        headingexample: "Überschrift",

        hr: "Horizontale Linie <hr> Ctrl+R",

        undo: "Rückgängig - Ctrl+Z",
        redo: "Wiederholen - Ctrl+Y",
        redomac: "Wiederholen - Ctrl+Shift+Z",

        help: "Markdown Hilfe"
    };

    ko.bindingHandlers.pagedownEditor = {
        init: function (element, valueAccessor) {
            var contentEditor = ko.unwrap(valueAccessor()),
                $elem = $(element),
                textArea = $elem.children('textarea')[0],
                toolBar = $elem.find('.wmd-toolbar')[0],
                preview = $elem.find('.wmd-preview')[0],
                $textArea = $(textArea),
                $toolBar = $(toolBar),
                $preview = $(preview),
                idSuffix = '-' + String(contentEditor.contentPart.Id()).replace('-', 'neg'),
                converter = new Markdown.Converter();

            $textArea.attr('id', 'wmd-input' + idSuffix);
            $toolBar.attr('id', 'wmd-button-bar' + idSuffix);
            $preview.attr('id', 'wmd-preview' + idSuffix);
            
            var options = {
                strings: markdownEditorButtonStrings
                //,helpButton: { handler: contentEditor.showHelp }
            };
            var editor = new Markdown.Editor(converter, idSuffix, options);

            $textArea.val(contentEditor.content());

            editor.hooks.onPreviewRefresh = function (x) {
                var cnt = $textArea.val();
                contentEditor.content(cnt);
                return x;
            };

            editor.hooks.insertImageDialog = contentEditor.insertPicture;
            editor.hooks.insertLinkDialog = contentEditor.insertLink;

            editor.run();
        }
    };

    return MarkdownContentEditor;
});