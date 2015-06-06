using System;

namespace SeMapBrowser.Models
{
    public class WorldFileReaderException : Exception
    {
        public WorldFileReaderException(string message)
            : base(message)
        { }
    }
}