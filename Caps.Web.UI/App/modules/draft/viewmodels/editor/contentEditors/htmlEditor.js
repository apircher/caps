define([
    'durandal/app',
    './insertLinkDialog'
],
function (app, InsertLinkDialog) {

    function HtmlContentEditor(editor, contentPart) {
        var self = this;

        self.insertLink = function (cm, editorCallback) {
            var dlg = new InsertLinkDialog();
            app.showDialog(dlg).then(function (dialogResult) {
                if (dialogResult.result) {
                    var openingTag = '<a href="' + dialogResult.url + '">',
                        closingTag = '</a>',
                        text = 'Text hier einfügen';

                    var s = cm.getSelection();
                    if (s.length) text = s;

                    var markup = '<a href="' + dialogResult.url + '">Text hier einfügen</a>';
                    cm.replaceSelection(openingTag + text + closingTag, 'start');

                    var pos = cm.getCursor();
                    pos.ch += openingTag.length;
                    cm.setSelection(pos, { line: pos.line, ch: pos.ch + text.length });

                    editorCallback(dialogResult.url);
                }
                else
                    editorCallback(null);
            });
            return true;
        };
    }

    return HtmlContentEditor;
});