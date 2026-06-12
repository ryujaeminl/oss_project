const { GoogleGenAI } = require("@google/genai");

try {
  console.log("Imported GoogleGenAI successfully");
  const ai = new GoogleGenAI({ apiKey: "test-api-key" });
  console.log("Initialized GoogleGenAI successfully");
  console.log("ai.models:", typeof ai.models);
} catch (e) {
  console.error("Initialization Error:", e);
}
