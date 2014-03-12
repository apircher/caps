using Caps.Consumer;
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
    public class CapsController : Controller
    {
        CapsHttpClient client;

        public CapsController()
        {
            client = new CapsHttpClient(new Uri(ConfigurationManager.AppSettings["caps:Url"]),
                ConfigurationManager.AppSettings["caps:AppKey"],
                ConfigurationManager.AppSettings["caps:AppSecret"]);
        }

        //
        // GET: /CapsContent/
        public async Task<ActionResult> Index(String id, String language)
        {
            int idValue;
            if (!int.TryParse(id, System.Globalization.NumberStyles.HexNumber, System.Globalization.CultureInfo.InvariantCulture, out idValue))
                return HttpNotFound();

            await client.InitAccessTokens();

            var svc = new ContentService(client);
            var content = await svc.GetContent(1, idValue);
            ViewBag.Content = content;

            if (!String.IsNullOrWhiteSpace(content.TemplateName) && ViewExists(content.TemplateName))
                return View(content.TemplateName);

            return View();
        }

        public async Task<ActionResult> ContentFile(int id, String name, bool inline)
        {
            await client.InitAccessTokens();

            var svc = new ContentService(client);
            var fileVersion = await svc.GetContentFileVersion(1, id);
            if (fileVersion == null)
                return HttpNotFound();

            var file = fileVersion.File;
            if (file == null || !String.Equals(name, file.FileName, StringComparison.OrdinalIgnoreCase))
                return HttpNotFound();

            if (inline)
            {
                Response.AddHeader("Content-Disposition", "inline; filename=" + file.FileName);
                return new FileContentResult(fileVersion.Content.Data, file.ContentType);
            }
            else
                return new FileContentResult(fileVersion.Content.Data, file.ContentType) { FileDownloadName = file.FileName };
        }

        public async Task<ActionResult> Thumbnail(int id, String name, String size)
        {
            await client.InitAccessTokens();

            var svc = new ContentService(client);
            var thumbnail = await svc.GetThumbnail(1, id, size);
            if (thumbnail == null)     // TODO: Return default document thumbnail...
                return HttpNotFound();

            return new FileContentResult(thumbnail.Data, thumbnail.ContentType);
        }

        bool ViewExists(string name)
        {
            ViewEngineResult result = ViewEngines.Engines.FindView(ControllerContext, name, null);
            return (result.View != null);
        }
	}
}