function doGet(e) {
  // Check if query parameter 'type=api' exists
  if (e.parameter.type === 'api') {
    return doGetApi(); // Return JSON response
  } else {
    return HtmlService.createHtmlOutputFromFile('Form'); // Return the HTML form
  }
}

// Add a row
function addRow(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow(data);
  return 'Row added successfully!';
}

// Edit a row
function editRow(id, updatedData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      for (let j = 0; j < updatedData.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(updatedData[j]);
      }
      return `Row with ID ${id} updated successfully!`;
    }
  }
  return `No row found with ID ${id}`;
}

// Delete a row
function deleteRow(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      sheet.deleteRow(i + 1);
      return `Row with ID ${id} deleted successfully!`;
    }
  }
  return `No row found with ID ${id}`;
}

// Search rows
function searchRows(query) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].some(cell => cell.toString().toLowerCase().includes(query.toLowerCase()))) {
      results.push(rows[i]);
    }
  }
  return results;
}

function doGetApi(e) {
  try {
    // 1. Get the Spreadsheet and Sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1"); // Replace "Sheet1" with your sheet name

    // 2. Get the Data (as a 2D array)
    var data = sheet.getDataRange().getValues();

    // 3. Sanitize and Convert to Array of Objects
    var headers = data[0]; // Assuming the first row contains headers
    var sanitizedData = [];

    for (var i = 1; i < data.length; i++) { // Start from the second row (data rows)
      var row = data[i];
      var rowObject = {};

      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        var cellValue = row[j];

        // Sanitization Logic based on Header Name (Example)
        if (header.startsWith("Title") || header.startsWith("Caption") || header.startsWith("Tags")|| header.startsWith("Type")) {
          // Allow commas and other punctuation in titles and captions, and Tags and Type
          rowObject[header] = String(cellValue);
        } else if (header.startsWith("Video") || header.startsWith("Audio")) {
          // Sanitize URLs (basic validation)
          rowObject[header] = isValidUrl(String(cellValue)) ? String(cellValue) : ""; // Store empty if invalid
        } else if (header === "Publish") {
            rowObject[header] = String(cellValue)
        }
         else {
          // Default Sanitization (e.g., remove commas)
          rowObject[header] = String(cellValue).replace(/,/g, ' ');
        }
      }
      sanitizedData.push(rowObject);
    }

    //console.log(ContentService.createTextOutput(JSON.stringify(sanitizedData)).setMimeType(ContentService.MimeType.JSON))

    // 4. Return JSON Response
    return ContentService.createTextOutput(JSON.stringify(sanitizedData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Handle Errors (Important!)
    Logger.log("Error in doGetApi: " + error);
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON); // Return error as JSON
  }
}

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function getOptions() {
  // Get the active spreadsheet and the specific sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Sheet1");

  // Define the range containing only the "Type" and "Tags" columns
  const dataRange = sheet.getRange(2, 5, sheet.getLastRow() - 1, 2); // Starting at column 5 ("Type") and spanning 2 columns
  const data = dataRange.getValues();

  // Create a structure to store unique Tags and Types
  const tagsSet = new Set();
  const typesSet = new Set();

  // Process the data to populate Tags and Types
  data.forEach(row => {
    if (row[0]) typesSet.add(row[0]); // "Type" is the first column in the range
    if (row[1]) tagsSet.add(row[1]); // "Tags" is the second column in the range
  });

  // Convert Sets to Arrays for return
  const tagsArray = Array.from(tagsSet);
  const typesArray = Array.from(typesSet);

  // Construct the final data object
  const optionsData = {
    Tags: tagsArray,
    Types: typesArray
  };

  Logger.log(optionsData); // Debugging: Log the options data
  return optionsData;
}