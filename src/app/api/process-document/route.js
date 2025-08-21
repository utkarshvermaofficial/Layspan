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
    You are an expert maritime logistics analyst. Your task is to extract operational events from a Statement of Facts document and provide comprehensive analysis.

    I will provide you with text that includes both raw OCR content and structured table data. Focus primarily on the "STRUCTURED TABLE DATA" section, especially Table 2 which contains the laytime calculation details.

    From the structured table data, extract each operational period with the following information:
    1. Parse each table row that represents a time period
    2. Combine Day + Date to create full dates
    3. Extract start and end times from the "Date / Time" column
    4. Use the "Remarks" column for event descriptions
    5. Calculate duration from start to end time

    For event descriptions, standardize using these categories where applicable:
    - "Full Work" (for "full", "Laytime Commenced", working periods)
    - "Rain" (for weather delays)
    - "Weekend" (for weekend periods)
    - "Machine Breakdown" (for "Conveyor 1 Breakdown" or similar)
    - Keep specific descriptions like "Berthed", "Arrival", "Loading commenced" as-is

    Output format: A single valid JSON object with two main sections:

    {
      "events": [array of event objects],
      "analysis": {analysis object}
    }

    Events array - each object with:
    - "event_description": Standardized description
    - "event_date": Date in YYYY-MM-DD format (combine day column with date)
    - "event_start_time": Start time in HH:MM format
    - "event_end_time": End time in HH:MM format  
    - "duration": Calculated duration in "HH:MM" format
    - "efficiency_rate": The rate percentage from the table (0%, 50%, 100%)

    Analysis object with:
    - "vessel_info": {vessel name, charter party date, loading port, cargo, owner, charterer}
    - "laytime_details": {cargo quantity, loading rate, demurrage rate, despatch rate}
    - "time_breakdown": {total_time, productive_time, weather_delays, weekend_time, breakdown_time, other_delays}
    - "efficiency_analysis": {overall_efficiency, main_delay_factors, cost_impact}
    - "remarks": "A comprehensive summary analyzing time spent, efficiency, main factors affecting operations, and recommendations"

    Important rules:
    - For rows where Day column is empty, use the date from the previous row with a Day value
    - Parse time ranges like "12:50 - 16:00" to extract start (12:50) and end (16:00) times
    - For full day entries like "00:00 - 24:00", use 00:00 start and 24:00 end
    - Skip header rows and invalid data rows
    - Convert dates like "12/01/17" to "2017-01-12" format
    - Extract efficiency rates from the "Rate" column (0%, 50%, 100%)

    CRITICAL: Return ONLY the JSON object, no explanations or markdown formatting.

    Here is the data to analyze:
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
            const analyzeResult = analysisResult.analyzeResult;
            const { content, tables, paragraphs } = analyzeResult;
            console.log("✅ OCR process completed successfully.");
            console.log(`Text length: ${content.length} characters`);
            
            // DEBUG: Log table data if available
            if (tables && tables.length > 0) {
                console.log("=== AZURE OCR EXTRACTED TABLES (START) ===");
                tables.forEach((table, index) => {
                    console.log(`\nTable ${index + 1}: ${table.rowCount} rows × ${table.columnCount} columns`);
                    
                    // Create a 2D array to store table data
                    const tableData = [];
                    for (let row = 0; row < table.rowCount; row++) {
                        tableData[row] = new Array(table.columnCount).fill('');
                    }
                    
                    // Fill the table data
                    if (table.cells) {
                        table.cells.forEach(cell => {
                            tableData[cell.rowIndex][cell.columnIndex] = cell.content || '';
                        });
                    }
                    
                    // Display as formatted table
                    console.log('\n' + '─'.repeat(120));
                    tableData.forEach((row, rowIndex) => {
                        const formattedRow = row.map(cell => {
                            // Truncate long content and pad
                            const truncated = cell.length > 18 ? cell.substring(0, 15) + '...' : cell;
                            return truncated.padEnd(20);
                        }).join('│');
                        console.log(`│${formattedRow}│`);
                        
                        // Add separator after header row
                        if (rowIndex === 0) {
                            console.log('├' + '─'.repeat(20 * table.columnCount + (table.columnCount - 1)) + '┤');
                        }
                    });
                    console.log('─'.repeat(120));
                });
                console.log("=== AZURE OCR EXTRACTED TABLES (END) ===");
            }

            // Enhanced text: combine content with structured table data
            let enhancedText = content;
            if (tables && tables.length > 0) {
                enhancedText += "\n\n=== STRUCTURED TABLE DATA ===\n";
                tables.forEach((table, tableIndex) => {
                    enhancedText += `\nTable ${tableIndex + 1}:\n`;
                    
                    if (table.cells) {
                        // Create a structured representation of the table
                        const tableRows = [];
                        for (let row = 0; row < table.rowCount; row++) {
                            tableRows[row] = [];
                        }
                        
                        table.cells.forEach(cell => {
                            tableRows[cell.rowIndex][cell.columnIndex] = cell.content;
                        });
                        
                        tableRows.forEach((row, rowIndex) => {
                            enhancedText += `Row ${rowIndex}: ${row.join(' | ')}\n`;
                        });
                    }
                });
            }

            // If no tables found, try to improve text structure using paragraphs
            if ((!tables || tables.length === 0) && paragraphs && paragraphs.length > 0) {
                enhancedText += "\n\n=== STRUCTURED PARAGRAPHS ===\n";
                paragraphs.forEach((paragraph, index) => {
                    enhancedText += `Paragraph ${index + 1}: ${paragraph.content}\n`;
                });
            }

            console.log("Sending extracted text to Gemini for analysis...");
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = buildPrompt(enhancedText);
            const geminiResult = await model.generateContent(prompt);
            const response = geminiResult.response;
            const responseText = response.text();
            
            // DEBUG: Log Gemini's raw response
            console.log("=== GEMINI RAW RESPONSE (START) ===");
            console.log(responseText);
            console.log("=== GEMINI RAW RESPONSE (END) ===");
            
            const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const geminiAnalysisResult = JSON.parse(jsonString);
            console.log("✅ Gemini analysis complete.");
            
            // DEBUG: Log parsed Gemini analysis result
            console.log("=== GEMINI PARSED ANALYSIS (START) ===");
            console.log(JSON.stringify(geminiAnalysisResult, null, 2));
            console.log("=== GEMINI PARSED ANALYSIS (END) ===");

            // Extract events and analysis from the result
            const structuredEvents = geminiAnalysisResult.events || geminiAnalysisResult || [];
            const analysis = geminiAnalysisResult.analysis || null;

            return NextResponse.json({
                json_output: structuredEvents,
                analysis: analysis,
                raw_text: enhancedText,
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
