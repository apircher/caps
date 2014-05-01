
#Caps.Consumer.Mvc 1.0


- Required manual steps
-------------------------------------------------------

1) Enter your Caps-Url, AppKey and AppSecret in Web.config.

2) Add a call to CapsConfig.RegisterContentControls in Application_Start:

    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            CapsConfig.RegisterContentControls();
			BundleConfig.RegisterBundles(BundleTable.Bundles);
			...
        }
    }
	
3) Add a call to CapsConfig.RegisterRoutes in RouteConfig:

    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            CapsConfig.RegisterRoutes(routes);
            ...
        }
    }
	


- Optional things / Notes for myself...
-------------------------------------------------------
	
 - Log Exceptions
-------------------------------------------------------

  Add a loging framework like NLog and log in Application_Error:

  protected void Application_Error(object sender, EventArgs e)
  {
  	// Get the error details
        HttpException lastErrorWrapper = Server.GetLastError() as HttpException;

        Exception lastError = lastErrorWrapper;
        if (lastErrorWrapper.InnerException != null)
          lastError = lastErrorWrapper.InnerException;

        string lastErrorTypeName = lastError.GetType().ToString();
        string lastErrorMessage = lastError.Message;
        string lastErrorStackTrace = lastError.StackTrace;

        NLog.LogManager.GetCurrentClassLogger().ErrorException("Unbehandelte Ausnahme", lastError);
  }

  Configure Logging (here NLog.config):

  <targets>
    <target xsi:type="File" name="f" fileName="${basedir}/logs/${shortdate}.log"
            layout="${longdate} ${uppercase:${level}} ${message} ${exception:format=tostring}" />
  </targets>
  <rules>
    <logger name="*" minlevel="Trace" writeTo="f" />
  </rules>


 - Show Custom Errors
-------------------------------------------------------

  public class ErrorsController : Controller
  {
    	public ActionResult Error404()
        {
            return View();
        }
  }  

  Configure custom errors in web.config:

  <system.web>
    ...
    <customErrors mode="On">
      <error statusCode="404" redirect="~/Errors/Error404" />
    </customErrors>
  </system.web>


 - Configure SMTP
-------------------------------------------------------

  <system.net>
    <mailSettings>
      <smtp deliveryMethod="Network" from="no-reply@yourmailserver.com">
        <network host="yoursmtphost.com" />
      </smtp>
    </mailSettings>
  </system.net>


 - Enable Compression and configure caching in Web.Release.config
-------------------------------------------------------

  <system.webServer>
    <urlCompression doStaticCompression="true" doDynamicCompression="false" xdt:Transform="Insert" />
    <staticContent xdt:Transform="Insert">
      <clientCache httpExpires="Sun, 29 Mar 2020 00:00:00 GMT" cacheControlMode="UseExpires" />
    </staticContent>
  </system.webServer>