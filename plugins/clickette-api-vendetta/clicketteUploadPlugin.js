import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";

if (!storage.apiKey) {
  storage.apiKey = ""; 
}

const MessageActions = findByProps("sendMessage", "receiveMessage");
const UploadManager = findByProps("upload", "cancel");

export default {
  name: "Clickette Uploader",
  description: "Uploads files to clickette.org instead of Discord CDN",
  authors: [{ name: "CheeseDev" }],
  version: "2.0.0",
  
  onLoad: () => {
    const uploadPatch = before("upload", UploadManager, (args) => {
      const [channelId, uploadData] = args;
      
      if (uploadData?.files?.length > 0) {
        args[0] = null;
        
        Promise.all(uploadData.files.map(async (file) => {
          try {
            showToast("Uploading to clickette.org...");
            
            const formData = new FormData();
            formData.append("file", file);
            
            if (!storage.apiKey) {
              showToast("Please set your clickette.org API key in plugin settings!");
              return;
            }
            
            const response = await fetch("https://clickette.org/api/upload", {
              method: "POST",
              headers: {
                "Authorization": storage.apiKey ? `Bearer ${storage.apiKey}` : undefined
                "Content-Type": "multipart/form-data"
              },
              body: formData
            });
            
            if (!response.ok) {
              throw new Error(`Upload failed with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            const fileUrl = data.resource?.url || 
                           `https://clickette.org/r/${data.resource?.fileName || data.fileName}`;
            
            console.log("Upload successful:", data);
            
            MessageActions.sendMessage(channelId, {
              content: fileUrl,
              tts: false,
              invalidEmojis: [],
              validNonShortcutEmojis: []
            });
            
            showToast("File uploaded to clickette.org!");
          } catch (error) {
            console.error("Upload error:", error);
            showToast(`Upload failed: ${error.message}`);
          }
        }));
        
        return args;
      }
    });
    
    return () => {
      uploadPatch();
    };
  },
  
  settings: () => {
    return [
      {
        type: "input",
        title: "API Key",
        placeholder: "Enter your clickette.org API key",
        value: storage.apiKey,
        onChange: (value) => {
          storage.apiKey = value;
        }
      },
      {
        type: "header",
        title: "Plugin Information"
      },
      {
        type: "text",
        title: "About",
        content: "This plugin redirects file uploads to clickette.org instead of Discord's CDN. After uploading, it posts the file link as a message."
      },
      {
        type: "button",
        title: "Get API Key",
        onClick: () => {
          const InAppBrowser = findByProps("openURL");
          InAppBrowser.openURL("https://clickette.org/dashboard");
        }
      }
    ];
  }
};
