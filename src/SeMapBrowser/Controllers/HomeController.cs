using System;
using System.IO;
using System.Linq;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Http;
using Microsoft.AspNet.Mvc;
using Newtonsoft.Json;
using SeMapBrowser.Models;

namespace SeMapBrowser.Controllers
{
    public sealed class HomeController : Controller
    {
        private readonly IHostingEnvironment _hostingEnvironment;

        public HomeController(IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        [Route("")]
        public IActionResult Index()
        {
            var worlds =
                from path in Directory.EnumerateFiles(_hostingEnvironment.MapPath(@"worlds"), "*.json")
                select WorldModel.Create(path);
            return View(new WorldListModel(worlds.ToArray()));
        }

        [HttpPost, Route("~/upload")]
        public IActionResult UploadWorld(IFormFile file)
        {
            try
            {
                using (var reader = WorldFileReader.Open(file))
                {
                    var world = WorldConverter.Convert(reader);
                    var filename = _hostingEnvironment.MapPath(string.Format(@"worlds\{0}.json",  reader.Name));

                    var replaced = false;
                    if (System.IO.File.Exists(filename))
                    {
                        replaced = true;
                        System.IO.File.Delete(filename);
                    }

                    var json = JsonConvert.SerializeObject(world);
                    System.IO.File.WriteAllText(filename, json);

                    return View(WorldUploadResultModel.OK(reader.Name, replaced ? "Existing world has been overwritten" : ""));
                }
            }
            catch (WorldFileReaderException e)
            {
                return View(WorldUploadResultModel.Failed(e.Message));
            }
            catch (Exception e)
            {
                return View(WorldUploadResultModel.Failed(e));
            }
        }

        [Route("error")]
        public IActionResult Error()
        {
            return View("~/Views/Shared/Error.cshtml");
        }

        [HttpGet, Route("~/world/{*id}")]
        public IActionResult ViewWorld(string id)
        {
            var path = _hostingEnvironment.MapPath(string.Format(@"worlds\{0}.json", id));
            if (!System.IO.File.Exists(path))
            {
                return View("WorldNotFound");
            }

            return View(WorldModel.Create(path));
        }
    }
}
