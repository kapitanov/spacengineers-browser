using Newtonsoft.Json;

namespace SeMapBrowser.Models
{
    public sealed class World
    {
        public World(Entity[] entities)
        {
            Entities = entities;
        }

        [JsonProperty("entities")]
        public Entity[] Entities { get; }
    }
}