using Newtonsoft.Json;

namespace SeMapBrowser.Models
{
    public sealed class Entity
    {
        public Entity(string type, string name, double x, double y, double z, double size = 1)
        {
            Type = type;
            Name = name;
            X = x;
            Y = y;
            Z = z;
            Size = size;
        }

        [JsonProperty("type")]
        public string Type { get; }

        [JsonProperty("name")]
        public string Name { get; }

        [JsonProperty("x")]
        public double X { get; }

        [JsonProperty("y")]
        public double Y { get; }

        [JsonProperty("z")]
        public double Z { get; }

        [JsonProperty("size")]
        public double Size { get; }
    }
}