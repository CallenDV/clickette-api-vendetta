import { registerCommand } from "@vendetta/commands";
import { showToast } from "@vendetta/ui";

const API_URL = "https://clickette.net/api/upload"; // Clickette API URL

registerCommand({
  name: "upload",
  description: "Upload a file to Clickette using Zipline.",
  options: [
    {
      type: "attachment",
      name: "file",
      description: "File to upload",
      required: true,
    },
    {
      type: "string",
      name: "password",
      description: "Optional password for file protection",
      required: false,
    },
  ],
  execute: async (args) => {
    const { file, password } = args;
    const formData = new FormData();
    formData.append("file", file);
    if (password) formData.append("password", password);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': 'Bearer KNf27zIei5Ati52osniqbXgJ.MTcxNzcxMDMzNDk5Nw' // Your token
        }
      });

      if (!response.ok) throw new Error("Failed to upload file.");

      const result = await response.json();
      const fileUrls = result.files.join(", ");
      showToast(`File uploaded! URLs: ${fileUrls}`, "success");
    } catch (error) {
      showToast(`Error: ${error.message}`, "error");
    }
  },
});
