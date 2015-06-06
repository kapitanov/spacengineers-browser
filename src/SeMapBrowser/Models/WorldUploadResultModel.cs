using System;
using System.Text;

namespace SeMapBrowser.Models
{
    public sealed class WorldUploadResultModel
    {
        private WorldUploadResultModel(bool success, string worldId, string message)
        {
            Success = success;
            WorldId = worldId;
            Message = message;
        }

        public bool Success { get; }
        public string WorldId { get; }
        public string Message { get; }

        public static WorldUploadResultModel OK(string id, string message = null)
        {
            return new WorldUploadResultModel(true, id, "World uploaded successfully. \n" + message);
        }

        public static WorldUploadResultModel Failed(string message)
        {
            return new WorldUploadResultModel(false, null, "Failed to upload world. \n" + message);
        }

        public static WorldUploadResultModel Failed(Exception exception)
        {
            var message = new StringBuilder();
            var e = exception;
            while (e != null)
            {
                if (e != exception)
                {
                    message.Append('\n');
                }

                message.Append(e.Message);
                e = e.InnerException;
            }

            return Failed(message.ToString());
        }
    }
}