using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Mvc;

namespace SeMapBrowser.Controllers
{
    public sealed class ApiController : Controller
    {
        private readonly IHostingEnvironment _hostingEnvironment;

        public ApiController(IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        [HttpGet, Route("~/api/worlds/{*id}")]
        public IActionResult GetWorld(string id)
        {
            var path = _hostingEnvironment.MapPath(string.Format(@"worlds\{0}.json",id));
            if (!System.IO.File.Exists(path))
            {
                return HttpNotFound();
            }
            
            return File(path, "application/json");
        }
    }
}