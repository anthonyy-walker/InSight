const fs = require("fs");
const OpenAI = require("openai");

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: "Key"
});

// Function to generate timestamps
function generateTimestamps(start, end, intervalMinutes) {
  const timestamps = [];
  let current = new Date(start);
  const endTime = new Date(end);

  while (current <= endTime) {
    timestamps.push(current.toISOString());
    current = new Date(current.getTime() + intervalMinutes * 60 * 1000);
  }

  return timestamps;
}

// Generate timestamps from 9 AM to 9 PM at 90-minute intervals
const timestamps = generateTimestamps(
  "2024-11-21T09:00:00Z", // Start at 9:00 AM
  "2024-11-21T21:00:00Z", // End at 9:00 PM
  90 // Interval in minutes
);

const locations = [
  { lat: 42.27976051915981, lon: -83.73138012049172 },
  { lat: 42.27914972881227, lon: -83.73187946154137 },
  { lat: 42.27765006096259, lon: -83.73397137071555 },
  { lat: 42.28259865024387, lon: -83.73355551009055 },
  { lat: 42.275738824408634, lon: -83.73522491737432 },
  { lat: 42.289681762246886, lon: -83.72085182876387 },
  { lat: 42.28225716414648, lon: -83.74572653739224 },
  { lat: 42.28084911447749, lon: -83.728798579661 },
];

const imageURLs = [
  "https://i.imgur.com/Qlp5csN.jpeg",
  "https://i.imgur.com/rpqVsGa.jpeg",
  "https://i.imgur.com/Q1SBJ9w.jpeg",
  "https://i.imgur.com/Lke45ts.jpeg",
  "https://i.imgur.com/MezkO11.jpeg",
  "https://i.imgur.com/sHrskQT.jpeg",
  "https://i.imgur.com/20nc9qx.jpeg",
];

// Create images array with timestamps
const images = timestamps.map((timestamp, index) => ({
  image_id: `${index + 1}`,
  url: imageURLs[index % imageURLs.length],
  timestamp,
  location: locations[index % locations.length],
}));

async function processImage(image) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI designed to analyze images from XR/VR device. For the demographics part in the JSON make sure it is just what demographics you see in the image for example: White 3, Black 6, Asain 4, Unknown 2. Your task is to evaluate the following metadata and describe the environment, activities, and people in JSON format. Do not include markdown code fences (\`\`\`) or any additional formatting—return only valid JSON. Fill in the JSON template below based on the provided image and metadata:
              
              Metadata:
              Demographics of XR/VR User:
              - Age: 19
              - Ethnicity: African American
              - Institution: University of Michigan
              - Residence: Mosher Jordan Hall
              - Major: Computer Science
              - Year: Freshman
              - Intrests: Piano, Research, VR Development
              - Timestamp: ${image.timestamp}
              - Location: Latitude ${image.location.lat}, Longitude ${image.location.lon}
              - Image URL: ${image.url}
              
              JSON template:
              {
                "timestamp": "${image.timestamp}",
                "location": {
                  "latitude": ${image.location.lat},
                  "longitude": ${image.location.lon}
                },
                "environment": {
                  "type": "",
                  "features": []
                },
                "activities": {
                  "possible": []
                },
                "text_elements": {
                  "notable": ""
                },
                "people": {
                  "actions": [],
                  "demographic": ""
                },
                "description": ""
              }
              
              Make sure to return valid JSON that can be directly parsed without any extra text outside of the JSON.`,
            },
            {
              type: "image_url",
              image_url: {
                url: image.url,
              },
            },
          ],
        },
      ],
    });

    // Parse the response content
    const rawContent = response.choices[0]?.message?.content || "";
    console.log(`Raw response for image ${image.image_id}:`, rawContent);

    let result;
    try {
      result = JSON.parse(rawContent); // Attempt to parse JSON
    } catch (parseError) {
      console.error(`Failed to parse JSON for image ${image.image_id}:`, parseError.message);
      return {
        error: "Failed to parse JSON response",
        rawContent,
      };
    }

    return result;
  } catch (error) {
    console.error(`Error processing image ${image.image_id}:`, error.message);
    return {
      error: "Failed to analyze image",
    };
  }
}

// Function to generate a daily summary
async function generateSummary(context) {
  // Prepare a concise text prompt based on all the images
  const summaryPrompt = `Here is the daily activity data for a user, including timestamp, environment, activities, and people. Summarize the user's day in a concise paragraph, mentioning key activities, times, and notable environments:
  
  ${context.images.map(img => `
  Timestamp: ${img.timestamp}
  Environment: ${img.environment?.type || "unknown"}
  Activities: ${img.activities?.possible?.join(", ") || "No activities detected"}
  People: ${img.people?.actions?.join(", ") || "No notable actions"}
  `).join("\n")}
  
  Provide a concise, human-readable summary of the user's day.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: summaryPrompt,
        },
      ],
      max_tokens: 200, // Adjust as needed for a concise summary
    });

    const summary = response.choices[0]?.message?.content.trim() || "Failed to generate summary.";
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error.message);
    return "Failed to generate summary due to an error.";
  }
}

// Main function to build JSON context and summary
async function buildDailyContext() {
  const context = {
    images: [],
    connection: {},
  };

  // Process images sequentially
  for (const image of images) {
    console.log(`Processing image: ${image.image_id}`);
    const analysis = await processImage(image); // Process each image immediately

    context.images.push({
      image_id: image.image_id,
      timestamp: image.timestamp,
      location: image.location,
      ...analysis,
    });
  }

  // Generate a concise summary using the AI API
  const quickSummary = await generateSummary(context);

  // Add summary to the context
  context.connection.description = quickSummary;

  // Save output to a JSON file
  const outputFilePath = "./daily_context.json";
  fs.writeFileSync(outputFilePath, JSON.stringify(context, null, 2));
  console.log(`Daily context saved to ${outputFilePath}`);
  console.log(`Summary: ${quickSummary}`);
}

// Run the script immediately
buildDailyContext()
  .then(() => console.log("Daily context built successfully."))
  .catch((err) => console.error("Error building daily context:", err));
