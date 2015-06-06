using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using Microsoft.AspNet.Http;
using Microsoft.Net.Http.Headers;

namespace SeMapBrowser.Models
{
    public sealed class WorldFileReader : IDisposable
    {
        private readonly ZipArchive _archive;
        private readonly ZipArchiveEntry _sbsEntry;
        private readonly ZipArchiveEntry _sbcEntry;

        private WorldFileReader(string name, ZipArchive archive, ZipArchiveEntry sbsEntry, ZipArchiveEntry sbcEntry)
        {
            Name = name;
            _archive = archive;
            _sbsEntry = sbsEntry;
            _sbcEntry = sbcEntry;
        }

        public string Name { get; }
        
        public Stream OpenSbsFile()
        {
            return _sbsEntry.Open();
        }

        public Stream OpenSbcFile()
        {
            return _sbcEntry.Open();
        }

        public void Dispose()
        {
            _archive.Dispose();
        }

        public static WorldFileReader Open(IFormFile file)
        {
            if (file == null)
            {
                throw new WorldFileReaderException("No file has been uploaded");
            }

            var filename = ContentDispositionHeaderValue.Parse(file.ContentDisposition).FileName.Trim('"');
            var ext = Path.GetExtension(filename);
            var isZip = string.Equals(ext, ".zip", StringComparison.OrdinalIgnoreCase);
            if (!isZip)
            {
                throw new WorldFileReaderException("World file should has a \".zip\" extension");
            }

            var zipFileStream = file.OpenReadStream();
            var archive = new ZipArchive(zipFileStream, ZipArchiveMode.Read);

            var sbsEntry = archive.Entries.FirstOrDefault(_ =>
                string.Equals(Path.GetExtension(_.FullName), ".sbs", StringComparison.OrdinalIgnoreCase)
                );
            if (sbsEntry == null)
            {
                throw new WorldFileReaderException("Archive should contain a \".sbs\" file");
            }

            var sbcEntry = archive.Entries.FirstOrDefault(_ =>
                string.Equals(Path.GetExtension(_.FullName), ".sbc", StringComparison.OrdinalIgnoreCase)
                );
            if (sbcEntry == null)
            {
                throw new WorldFileReaderException("Archive should contain a \".sbc\" file");
            }

            return new WorldFileReader(Path.GetFileNameWithoutExtension(filename), archive, sbsEntry, sbcEntry);
        }
    }
}