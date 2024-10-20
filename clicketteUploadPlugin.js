import { registerCommand } from "@vendetta/commands";
import { showToast } from "@vendetta/ui";
import { storage } from "@vendetta/plugin";

// Default API URL
const API_URL = "https://clickette.net/api/upload";

// Plugin settings to store the API token
if (!storage.apiToken) storage.apiToken = ""; // Initialize if not set

// Create a settings option for adding the API token
export const settings = [
  {
    type: "input",
    name: "API Token",
    key: "apiToken",
    value: storage.apiToken,
    placeholder: "Enter your Clickette API token",
    onChange: (value) => {
      storage.apiToken = value;
      showToast("API token updated!", "success");
    },
  },
];

// Register command for uploading a file
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

    // Check if API token is set
    if (!storage.apiToken) {
      showToast("API token not set. Go to settings to add it.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (password) formData.append("password", password);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${storage.apiToken}`,
        },
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
