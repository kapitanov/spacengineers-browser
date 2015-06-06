namespace SeMapBrowser.Models
{
    public sealed class WorldListModel
    {
        public WorldListModel(WorldModel[] worlds)
        {
            Worlds = worlds;
        }

        public WorldModel[] Worlds { get; }
    }
}
