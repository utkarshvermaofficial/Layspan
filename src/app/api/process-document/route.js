// src/app/api/process-document/route.js
// This is your backend API endpoint.

import { NextResponse } from 'next/server';
import DocumentIntelligence, { isUnexpected } from "@azure-rest/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Initialize API Clients with credentials from .env.local ---
const azureEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const azureKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

// Use the new client from @azure-rest/ai-document-intelligence
const documentIntelClient = DocumentIntelligence(azureEndpoint, new AzureKeyCredential(azureKey));
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Helper function to build the prompt for Gemini
function buildPrompt(text) {
    return `
    You are an expert maritime logistics analyst. Your task is to meticulously extract and structure all operational events from the provided Statement of Facts document text.

    Analyze the following text and perform these actions:
    1.  Identify every distinct operational period, including work, delays, and official milestones.
    2.  For each period, extract the description, full date, start time, and end time.
    3.  Standardize the event description using the remarks. Use one of the following predefined categories where applicable: "Full Work", "Rain", "Machine Breakdown", "Weekend", "Shifting", "Bunkering", "Draft Survey". For milestones like "Arrival" or "Berthed", use the text as is.
    4.  Calculate the duration of each period in "HH:MM" format.
    5.  Provide the output as a single, valid JSON array of objects.

    Each object in the array must have exactly these five keys:
    - "event_description": The standardized description of the event (e.g., "Full Work", "Rain").
    - "event_date": The date of the event in YYYY-MM-DD format. If no date is found, use null.
    - "event_start_time": The start time of the period in HH:MM format.
    - "event_end_time": The end time of the period in HH:MM format.
    - "duration": The calculated duration of the period as a string in "HH:MM" format.

    CRITICAL: Do not include any text, explanations, or markdown formatting outside of the final JSON array.

    Here is the text to analyze:
    ---
    ${text}
    ---
    `;
}

// Helper to convert Node.js stream to buffer
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }
        
        const fileBuffer = await streamToBuffer(file.stream());

        console.log("Starting OCR process with Azure...");
        const poller = await documentIntelClient.path("/documentModels/{modelId}:analyze", "prebuilt-layout").post({
            contentType: "application/octet-stream",
            body: fileBuffer,
        });

        if (isUnexpected(poller)) {
            throw new Error(`Unexpected response: ${poller.status} ${poller.body.error?.message}`);
        }

        // Wait for the operation to complete
        const operationLocation = poller.headers["operation-location"];
        if (!operationLocation) {
            throw new Error("No operation location returned from Azure");
        }

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        let analysisResult = null;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const statusResponse = await fetch(operationLocation, {
                headers: {
                    'Ocp-Apim-Subscription-Key': azureKey
                }
            });
            
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'succeeded') {
                analysisResult = statusData;
                break;
            } else if (statusData.status === 'failed') {
                throw new Error(`Analysis failed: ${statusData.error?.message || 'Unknown error'}`);
            }
            
            attempts++;
        }

        if (!analysisResult) {
            throw new Error("Analysis timed out");
        }

        // Check for a valid response structure before destructuring
        if (analysisResult.analyzeResult?.content) {
            const { content } = analysisResult.analyzeResult;
            console.log("✅ OCR process completed successfully.");

            console.log("Sending extracted text to Gemini for analysis...");
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = buildPrompt(content);
            const geminiResult = await model.generateContent(prompt);
            const response = geminiResult.response;
            const responseText = response.text();
            
            const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const structuredEvents = JSON.parse(jsonString);
            console.log("✅ Gemini analysis complete.");

            return NextResponse.json({
                json_output: structuredEvents,
                raw_text: content,
            });
        } else {
             console.error("Azure OCR failed to extract content or returned an unexpected response format.");
             console.error("Azure Response Body:", analysisResult);
             return NextResponse.json({ error: 'Failed to extract text from document.' }, { status: 500 });
        }

    } catch (error) {
        console.error("An error occurred in the API route:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
