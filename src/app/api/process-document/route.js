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
    You are an expert maritime operations analyst specializing in Statement of Facts (SOF) analysis and laytime calculations. Your task is to extract and analyze operational data with maximum accuracy.

    MISSION: Transform raw Statement of Facts documents into structured operational intelligence with precise time calculations and efficiency metrics.

    PROCESSING STRATEGY:
    1. 📋 COMPREHENSIVE DATA EXTRACTION: Analyze ALL documents as a unified Statement of Facts
    2. 🔍 INTELLIGENT EVENT IDENTIFICATION: Extract every operational period, activity, and delay
    3. ⏱️ PRECISE TIME CALCULATIONS: Ensure mathematically accurate duration and efficiency computations
    4. 🏗️ PARALLEL OPERATION HANDLING: Recognize simultaneous activities and calculate overlapping time correctly
    5. 📊 COMPLETE ANALYSIS: Provide detailed insights even if structured events are limited

    EXTRACTION METHODOLOGY:
    From table data across all documents:
    1. Parse each table row representing operational periods
    2. Combine Day + Date columns to create complete dates (YYYY-MM-DD format)
    3. Extract time ranges from "Date/Time" column (handle formats like "08:00-12:00", "00:00-24:00")
    4. Use "Remarks/Activity" column for detailed event descriptions
    5. Calculate precise duration between start and end times
    6. Extract efficiency rates from "Rate" column (0%, 50%, 100%)
    7. PRESERVE ALL EVENTS - maintain data integrity by keeping every extracted event

    EVENT STANDARDIZATION:
    Transform descriptions using these categories where applicable:
    - "Full Work" → for productive loading/working periods, "Laytime Commenced"
    - "Loading commenced" → actual start of cargo operations
    - "Completed loading" → end of cargo operations
    - "Suspended loading" → temporary work stoppages
    - "Weather delays" → for rain, storm, high wind conditions
    - "Weekend" → for weekend periods and holidays
    - "Equipment Breakdown" → for conveyor, crane, machinery failures
    - "Survey" → for cargo surveys, draft surveys, inspection activities
    - "Formalities" → for customs, immigration, port authority procedures
    - "Waiting" → for delays awaiting surveyors, documentation, clearances
    - Keep vessel-specific events like "Arrival", "Berthed", "Departed" as-is

    CRITICAL CALCULATION REQUIREMENTS:
    ⏰ TIME ACCURACY:
    - Handle time formats: "08:00-12:00", "1200-1800", "00:00-24:00"
    - Convert 24:00 to end-of-day calculations
    - Sum durations by converting to minutes, adding, then converting back to HH:MM
    - Account for date changes in multi-day operations

    📊 EFFICIENCY METRICS:
    - Overall Efficiency = (Total Productive Hours ÷ Total Operation Hours) × 100
    - Time-Based Efficiency = (Productive Hours ÷ Working Hours excluding weekends) × 100
    - Consider parallel operations: use maximum duration in overlapping time slots
    - Identify main delay factors and quantify their impact

    📈 PARALLEL OPERATIONS:
    When multiple activities occur simultaneously (e.g., "Survey" + "Loading"):
    - Use the maximum duration of overlapping activities
    - Don't double-count time periods
    - Note parallel work in analysis for transparency

    JSON OUTPUT STRUCTURE:
    {
      "events": [
        {
          "event_description": "Standardized activity name",
          "event_date": "YYYY-MM-DD",
          "event_start_time": "HH:MM",
          "event_end_time": "HH:MM",
          "duration": "HH:MM",
          "efficiency_rate": 0|50|100
        }
      ],
      "analysis": {
        "vessel_info": {
          "vessel_name": "Extract from document headers",
          "loading_port": "Port name where operations occurred",
          "cargo": "Type and quantity of cargo",
          "owner": "Vessel owner if mentioned",
          "charterer": "Charterer if mentioned",
          "charter_party_date": "CP date if available"
        },
        "laytime_details": {
          "cargo_quantity": "Total cargo quantity with units",
          "loading_rate": "Expected loading rate per hour/day",
          "demurrage_rate": "Demurrage rate if mentioned",
          "despatch_rate": "Despatch rate if mentioned"
        },
        "time_breakdown": {
          "total_operation_time": "HH:MM format - from first to last event",
          "productive_time": "HH:MM format - sum of all Full Work periods",
          "weather_delays": "HH:MM format - time lost to weather",
          "weekend_time": "HH:MM format - weekend/holiday periods",
          "equipment_breakdown": "HH:MM format - machinery failure time",
          "other_delays": "HH:MM format - surveys, formalities, waiting time",
          "parallel_work_note": "Explanation of how overlapping activities were handled"
        },
        "efficiency_analysis": {
          "overall_efficiency": "Percentage with % symbol",
          "time_based_efficiency": "Percentage excluding weekends",
          "productive_hours": "HH:MM format - total working time",
          "weather_impact": "HH:MM format - weather delay impact",
          "main_delay_factors": ["Array of primary delay causes"],
          "cost_impact": "Financial impact description if calculable",
          "calculation_method": "Detailed explanation of efficiency calculation methodology"
        },
        "key_insights": [
          "Array of operational insights and patterns identified",
          "Performance benchmarks and comparisons",
          "Risk factors and operational challenges noted"
        ],
        "remarks": "Comprehensive executive summary with accurate time figures, efficiency analysis, main operational challenges, and actionable recommendations for future operations"
      }
    }

    QUALITY ASSURANCE CHECKLIST:
    ✅ All time calculations verified mathematically
    ✅ Efficiency percentages computed correctly
    ✅ Parallel operations handled without double-counting
    ✅ All events preserved (no arbitrary removal)
    ✅ Vessel and cargo information extracted
    ✅ Insights provided even for incomplete data
    ✅ JSON format validated and complete

    RETURN: Valid JSON object only, no additional text or formatting.

    DOCUMENT CONTENT TO ANALYZE:
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

// Helper function to process a single file and extract content
async function processFile(file) {
    const fileBuffer = await streamToBuffer(file.stream());

    console.log(`Starting OCR process for ${file.name}...`);
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

        return {
            filename: file.name,
            content: enhancedText,
            tables: tables,
            success: true
        };
    } else {
        throw new Error(`Failed to extract content from ${file.name}`);
    }
}

// Helper function to parse duration string to minutes for comparison
function parseDuration(durationStr) {
    if (!durationStr) return 0;
    const parts = durationStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files'); // Get all files

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
        }

        console.log(`Processing ${files.length} files as a batch...`);
        
        // Process all files in parallel
        const fileProcessingPromises = files.map(file => processFile(file));
        const processedFiles = await Promise.all(fileProcessingPromises);
        
        // Combine all extracted content
        let combinedContent = "=== MULTI-DOCUMENT ANALYSIS ===\n";
        combinedContent += "This analysis covers multiple documents that are part of the same Statement of Facts set.\n\n";
        
        processedFiles.forEach((fileResult, index) => {
            combinedContent += `\n=== DOCUMENT ${index + 1}: ${fileResult.filename} ===\n`;
            combinedContent += fileResult.content;
            combinedContent += "\n" + "=".repeat(80) + "\n";
        });

        console.log("Sending combined content to Gemini for analysis...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Enhanced prompt for multi-document processing
        const enhancedPrompt = buildPrompt(combinedContent).replace(
            "From the structured table data, extract each operational period",
            "From ALL the documents provided (which are parts of the same Statement of Facts), extract ALL operational periods chronologically. These documents may contain overlapping information, so please extract ALL events in chronological order preserving every operational period mentioned"
        );
        
        const geminiResult = await model.generateContent(enhancedPrompt);
        const response = geminiResult.response;
        const responseText = response.text();
        
        console.log("=== GEMINI RAW RESPONSE (START) ===");
        console.log(responseText);
        console.log("=== GEMINI RAW RESPONSE (END) ===");
        
        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const geminiAnalysisResult = JSON.parse(jsonString);
        console.log("✅ Gemini analysis complete.");
        
        // Extract all events - no filtering or removal
        let structuredEvents = geminiAnalysisResult.events || geminiAnalysisResult || [];
        const originalEventCount = structuredEvents.length;
        
        console.log(`Initial events extracted: ${originalEventCount}`);
        
        // No event removal - keep all events as extracted by Gemini
        const finalEventCount = structuredEvents.length;
        
        console.log(`Total events extracted: ${finalEventCount}`);
        
        // Log all events for verification
        console.log("All extracted events:");
        structuredEvents.forEach((event, index) => {
            console.log(`${index + 1}. ${event.event_description} | ${event.event_date} ${event.event_start_time}-${event.event_end_time} | ${event.duration}`);
        });
        
        // Use Gemini's analysis results directly - even if no events, get vessel info and insights
        let analysis = geminiAnalysisResult.analysis || {};
        
        // If no events found, still provide basic analysis from document content
        if (structuredEvents.length === 0) {
            console.log("No events extracted, but providing document analysis");
            analysis = {
                vessel_info: analysis.vessel_info || {},
                time_breakdown: analysis.time_breakdown || {
                    total_operation_time: "00:00",
                    productive_time: "00:00",
                    weather_delays: "00:00",
                    weekend_time: "00:00",
                    equipment_breakdown: "00:00",
                    other_delays: "00:00"
                },
                efficiency_analysis: analysis.efficiency_analysis || {
                    overall_efficiency: 0,
                    time_based_efficiency: 0,
                    productive_hours: "00:00",
                    weather_impact: "00:00",
                    calculation_method: "No operational events found in document"
                },
                key_insights: analysis.key_insights || ["Document processed but no operational events detected"],
                remarks: analysis.remarks || "Document analyzed but no structured operational data found. This may be due to document format or content type."
            };
        }
        
        console.log(`✅ Processing complete. ${structuredEvents.length} events extracted from ${files.length} files.`);

        return NextResponse.json({
            json_output: structuredEvents,
            analysis: analysis,
            raw_text: combinedContent,
            processing_stats: {
                files_processed: files.length,
                total_events_found: originalEventCount,
                final_events: finalEventCount,
                events_removed: 0, // No event removal
                analysis_method: "Gemini AI analysis with all events preserved"
            }
        });

    } catch (error) {
        console.error("An error occurred in the API route:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
