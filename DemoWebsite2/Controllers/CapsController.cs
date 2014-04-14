using Caps.Consumer;
using Caps.Consumer.Mvc;
using Caps.Consumer.Mvc.Attributes;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace DemoWebsite2.Controllers
{
    [SetCulture]
    public class CapsController : CapsControllerBase
    {
        //
        // GET: /CapsContent/
        public async Task<ActionResult> Index(String id, String language)
        {
            int idValue;
            if (!int.TryParse(id, System.Globalization.NumberStyles.HexNumber, System.Globalization.CultureInfo.InvariantCulture, out idValue))
                throw new HttpException(404, "Not found");

            var content = await ContentService.GetContent(1, idValue);
            ViewBag.Content = content;

            String name = RouteData.Values["name"] as String;
            if (!ValidateContentName(content, name))
            {
                var node = FindContentByName(name);
                if (node != null)
                    return new RedirectResult(node.Url, true);

                throw new HttpException(404, "Not found");
            }

            if (content.SiteMapNode.IsNodeTypeIn("CONTAINER"))
                return View("Container");

            if (!String.IsNullOrWhiteSpace(content.TemplateName) && ViewExists(content.TemplateName))
                return View(content.TemplateName);

            return View();
        }

        public ActionResult ContentByName(String name)
        {
            var node = FindContentByName(name);
            if (node != null)
                return new RedirectResult(node.Url, true);

            throw new HttpException(404, "Not found");
        }

        public async Task<ActionResult> ContentFile(int id, String name, bool inline)
        {
            var fileVersion = await ContentService.GetContentFileVersion(1, id);
            if (fileVersion == null)
                return HttpNotFound();

            var file = fileVersion.File;
            if (file == null || !String.Equals(name, file.FileName, StringComparison.OrdinalIgnoreCase))
                return HttpNotFound();

            if (inline)
            {
                if (CheckClientETag(fileVersion))
                    return new HttpStatusCodeResult(System.Net.HttpStatusCode.NotModified);

                SetClientETag(fileVersion);
                Response.AddHeader("Content-Disposition", "inline; filename=" + file.FileName);
                return new FileContentResult(fileVersion.Content.Data, file.ContentType);
            }
            else
                return new FileContentResult(fileVersion.Content.Data, file.ContentType) { FileDownloadName = file.FileName };
        }

        public async Task<ActionResult> Thumbnail(int id, String name, String size = "250x250", String fitMode = "Default")
        {
            var thumbnail = await ContentService.GetThumbnail(1, id, size, fitMode);
            if (thumbnail == null)     // TODO: Return default document thumbnail...
                return HttpNotFound();

            if (CheckClientETag(thumbnail))
                return new HttpStatusCodeResult(System.Net.HttpStatusCode.NotModified);

            SetClientETag(thumbnail);
            return new FileContentResult(thumbnail.Data, thumbnail.ContentType);
        }
	}
}