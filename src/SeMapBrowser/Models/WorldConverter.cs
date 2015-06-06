﻿using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Xml.Linq;

namespace SeMapBrowser.Models
{
    public static class WorldConverter
    {
        public static World Convert(WorldFileReader reader)
        {
            var world = new World(ConvertSbs(reader).Concat(ConvertSbc(reader)).ToArray());
            return world;
        }

        private static IEnumerable<Entity> ConvertSbs(WorldFileReader reader)
        {
            using (var stream = reader.OpenSbsFile())
            {
                var xml = XDocument.Load(stream);
                var entities = xml
                    .Element("MyObjectBuilder_Sector")
                    .Element("SectorObjects")
                    .Elements("MyObjectBuilder_EntityBase");

                foreach (var entity in entities)
                {
                    string name = "";
                    var type = entity.Attribute("{http://www.w3.org/2001/XMLSchema-instance}type").Value;
                    switch (type)
                    {
                        case "MyObjectBuilder_VoxelMap":
                            type = EntityTypes.ASTEROID;
                            var storageNameElement = entity.Element("StorageName");
                            name = storageNameElement != null ? storageNameElement.Value : "";
                            break;

                        case "MyObjectBuilder_FloatingObject":
                            type = EntityTypes.DEBRIS;
                            break;

                        case "MyObjectBuilder_CubeGrid":
                            if (entity.Element("GridSizeEnum").Value == "Large")
                            {
                                type = EntityTypes.LARGE_SHIP;
                            }
                            else
                            {
                                type = EntityTypes.SMALL_SHIP;
                            }
                            var displayNameElement = entity.Element("DisplayName");
                            name = displayNameElement != null ? displayNameElement.Value : "";
                            break;

                        default:
                            continue;
                    }

                    var positionNode = entity.Element("PositionAndOrientation").Element("Position");
                    var x = double.Parse(positionNode.Attribute("x").Value, CultureInfo.InvariantCulture);
                    var y = double.Parse(positionNode.Attribute("y").Value, CultureInfo.InvariantCulture);
                    var z = double.Parse(positionNode.Attribute("z").Value, CultureInfo.InvariantCulture);

                    yield return new Entity(type, name, x, y, z);
                }
            }
        }

        private static IEnumerable<Entity> ConvertSbc(WorldFileReader reader)
        {
            using (var stream = reader.OpenSbcFile())
            {
                var xml = XDocument.Load(stream);
                var root = xml
                    .Element("MyObjectBuilder_Checkpoint")
                    .Element("Gps")
                    .Element("dictionary")
                    .Elements("item");

                var entries = from item in root
                              from value in item.Elements("Value")
                              from entry in value.Element("Entries").Elements("Entry")
                              select entry;

                foreach (var entry in entries)
                {
                    var name = entry.Element("name").Value;
                    var coordsNode = entry.Element("coords");
                    var x = double.Parse(coordsNode.Element("X").Value, CultureInfo.InvariantCulture);
                    var y = double.Parse(coordsNode.Element("Y").Value, CultureInfo.InvariantCulture);
                    var z = double.Parse(coordsNode.Element("Z").Value, CultureInfo.InvariantCulture);

                    yield return new Entity(EntityTypes.GPS, name, x, y, z);
                }
            }
        }
    }
}