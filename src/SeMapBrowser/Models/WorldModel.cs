using System;
using System.IO;

namespace SeMapBrowser.Models
{
    public sealed class WorldModel
    {
        public WorldModel(string name, DateTime date)
        {
            Name = name;
            Date = date;
        }

        public string Name { get; }
        public DateTime Date { get; }

        public static WorldModel Create(string path)
        {
            var date = File.GetLastWriteTimeUtc(path);
            var name = Path.GetFileNameWithoutExtension(path);

            return new WorldModel(name, date);
        }
    }
}