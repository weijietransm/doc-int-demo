document.addEventListener('DOMContentLoaded', () => {
    const documentInput = document.getElementById('documentInput');
    const processButton = document.getElementById('processButton');
    const endpointInput = document.getElementById('endpointInput');
    const keyInput = document.getElementById('keyInput');
    const modelIdInput = document.getElementById('modelIdInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsSection = document.getElementById('resultsSection');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');    
    const downloadCsvButton = document.getElementById('downloadCsvButton');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const uploadArea = document.getElementById('uploadArea');
    const selectedFileName = document.getElementById('selectedFileName');
    
    // Create variables to track header dragging
    let draggedHeader = null;
    let originalHeaderIndex = -1;
    
    processButton.addEventListener('click', processDocument);
    downloadCsvButton.addEventListener('click', () => downloadTableAsCSV());
    
    // Define handleFile function here so it's accessible to loadSampleFile
    function handleFile(file) {
        // Display the selected filename
        const fileName = file.name;
        
        // Show the process button since we have a file
        processButton.classList.remove('hidden');
        
        // If file is a ZIP, update the UI to reflect that
        if (file.name.toLowerCase().endsWith('.zip')) {
            uploadArea.innerHTML = `
                <div class="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 12V8H16V2H8v6H2v14h20V12zM16 16H8v-4h8v4z"/>
                    </svg>
                </div>
                <p>Selected ZIP file: ${fileName}</p>
            `;
        } 
        // If it's a PDF or image, we could add specific icons for those too
        else if (file.name.toLowerCase().endsWith('.pdf')) {
            uploadArea.innerHTML = `
                <div class="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <p>Selected PDF file: ${fileName}</p>
            `;
        } else {
            // For other file types
            uploadArea.innerHTML = `
                <div class="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                </div>
                <p>Selected file: ${fileName}</p>
            `;
        }
    }

    // Sample files functionality
    const sampleFiles = document.querySelectorAll('.sample-file');
    sampleFiles.forEach(sampleFile => {
        // Clicking on the file container loads the sample
        sampleFile.addEventListener('click', (e) => {
            // Only trigger if click wasn't on a button
            if (!e.target.closest('.file-actions')) {
                const filename = sampleFile.dataset.filename;
                loadSampleFile(`samples/${filename}`);
            }
        });

        // View button
        const viewBtn = sampleFile.querySelector('.file-view-btn');
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const filename = sampleFile.dataset.filename;
            loadSampleFile(`samples/${filename}`);
        });

        // Download button
        const downloadBtn = sampleFile.querySelector('.file-download-btn');
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const filename = sampleFile.dataset.filename;
            downloadSampleFile(`samples/${filename}`, filename);
        });
    });

    // Function to load a sample file
    async function loadSampleFile(filePath) {
        try {
            showLoading(true);
            hideResults();
            hideError();

            // Get just the filename for display purposes
            const filename = filePath.split('/').pop();
            
            // Fetch the sample file from the server
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`Failed to load sample file: ${filename}`);
            }
            
            const blob = await response.blob();
            const file = new File([blob], filename, { type: blob.type });
            
            // Update the file input and handle the file
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            documentInput.files = dataTransfer.files;
            
            // Display the file name correctly
            handleFile(file);
            
            // Make sure the UI clearly shows which sample file was selected
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                uploadArea.innerHTML = `
                    <div class="upload-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    </div>
                    <p>Selected PDF file: ${filename}</p>
                `;
            }
            
            showLoading(false);
        } catch (error) {
            showError(error.message || 'An error occurred while loading the sample file.');
            showLoading(false);
        }
    }

    // Function to download a sample file
    function downloadSampleFile(filePath, filename) {
        const link = document.createElement('a');
        link.href = filePath;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function processDocument() {
        // Get the selected file
        const file = documentInput.files[0];
        if (!file) {
            showError('Please select a document to process.');
            return;
        }

        // Get configuration values
        const endpoint = endpointInput.value.trim();
        const apiKey = keyInput.value.trim();
        const modelId = modelIdInput.value.trim();

        // Validate configuration
        if (!endpoint || !apiKey || !modelId) {
            showError('Please provide your Azure Document Intelligence endpoint, API key, and model ID.');
            return;
        }        try {
            // Show loading indicator
            showLoading(true);
            hideResults();
            hideError();

            // Process the document with Azure Document Intelligence
            const extractionResults = await extractDataFromDocument(file, endpoint, apiKey, modelId);
            
            // Display the results
            displayResults(extractionResults);
            
            // Hide loading indicator and show results
            showLoading(false);
            showResults();
        } catch (error) {
            showError(error.message || 'An error occurred while processing the document.');
            showLoading(false);
        }
    }    
    
    // Function to swap only table headers without affecting data
    function swapTableHeaders(fromIndex, toIndex) {
        const table = document.getElementById('resultsTable');
        const headerRow = table.querySelector('thead tr');
        
        // Get the headers directly from the DOM to ensure current state
        const headers = Array.from(headerRow.cells);
        
        // Don't do anything if indices are the same
        if (fromIndex === toIndex) return;
        
        // Simple approach: move the source header to before or after the target
        const sourceHeader = headers[fromIndex];
        const targetHeader = headers[toIndex];
        
        // Clone the source header to maintain properties
        const newHeader = sourceHeader.cloneNode(true);
        
        // Remove the original source header
        headerRow.removeChild(sourceHeader);
        
        // Insert at the correct position
        if (fromIndex < toIndex) {
            // If moving right, insert after target
            if (targetHeader.nextSibling) {
                headerRow.insertBefore(newHeader, targetHeader.nextSibling);
            } else {
                headerRow.appendChild(newHeader);
            }
        } else {
            // If moving left, insert before target
            headerRow.insertBefore(newHeader, targetHeader);
        }
        
        // Re-apply draggable functionality to all headers
        setupTableHeaderDragAndDrop();
    }
    
    // Update the download CSV function to respect the current header order
    function updateDownloadCSVFunction() {
        // Get reference to the button (don't create a clone)
        const downloadButton = document.getElementById('downloadCsvButton');
        
        // Remove existing listeners by creating a new function
        downloadButton.removeEventListener('click', downloadTableAsCSV);
        
        // Add new event listener
        downloadButton.addEventListener('click', () => downloadTableAsCSV());
    }
    
    // Updated CSV download functionality for editable fields and reordered headers
    function downloadTableAsCSV(filename = 'extraction_results.csv') {
        // Get the current header cells
        const headerCells = resultsTable.querySelectorAll('thead th');
        const headerTexts = Array.from(headerCells).map(cell => cell.textContent);
        
        // Create CSV header row
        const headers = headerTexts.map(text => '"' + text.replace(/"/g, '""') + '"');
        
        // Get all data rows
        const rowElements = resultsTable.querySelectorAll('tbody tr');
        const rows = [];
        
        // Create an array to hold all row data
        rowElements.forEach(rowElement => {
            const cells = rowElement.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => {
                return '"' + cell.textContent.replace(/"/g, '""') + '"';
            });
            rows.push(rowData.join(','));
        });
        
        // Combine headers and rows
        const csv = [
            headers.join(','),
            ...rows
        ].join('\n');
        
        // Create and trigger download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Setup drag and drop for table headers
    function setupTableHeaderDragAndDrop() {
        const tableHeaders = document.querySelectorAll('#resultsTable thead th');
        
        tableHeaders.forEach((header, index) => {
            header.setAttribute('draggable', 'true');
            header.classList.add('draggable-header');
            
            // Clean up existing event listeners by cloning
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            // Add event listeners to the new header
            newHeader.addEventListener('dragstart', function(e) {
                draggedHeader = newHeader;
                originalHeaderIndex = Array.from(document.querySelectorAll('#resultsTable thead th')).indexOf(this);
                
                // Add visual feedback for dragging
                setTimeout(() => {
                    this.classList.add('dragging');
                }, 0);
                
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', originalHeaderIndex);
            });
            
            newHeader.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                this.classList.add('drag-over');
            });
            
            newHeader.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });
            
            newHeader.addEventListener('dragend', function() {
                document.querySelectorAll('#resultsTable thead th').forEach(h => {
                    h.classList.remove('dragging', 'drag-over');
                });
            });
            
            newHeader.addEventListener('drop', function(e) {
                e.preventDefault();
                const targetIndex = Array.from(document.querySelectorAll('#resultsTable thead th')).indexOf(this);
                
                if (originalHeaderIndex !== targetIndex && originalHeaderIndex !== -1) {
                    swapTableHeaders(originalHeaderIndex, targetIndex);
                }
                
                this.classList.remove('drag-over');
            });
        });
        
        // Update the CSV download function once after setting up headers
        if (tableHeaders.length > 0) {
            // Add a click handler for the download button
            const downloadButton = document.getElementById('downloadCsvButton');
            if (downloadButton) {
                // Clean old listeners
                const newButton = downloadButton.cloneNode(true);
                if (downloadButton.parentNode) {
                    downloadButton.parentNode.replaceChild(newButton, downloadButton);
                }
                
                // Add new listener
                newButton.addEventListener('click', () => downloadTableAsCSV());
            }
        }
    }

    async function extractDataFromDocument(file, endpoint, apiKey, modelId) {
        // Create form data to send the file
        const formData = new FormData();
        formData.append('file', file);

        // Create the URL for the Azure Document Intelligence API
        const apiUrl = `${endpoint}/formrecognizer/documentModels/${modelId}:analyze?api-version=2023-07-31`;
        
        // First API call to start the analysis
        const analysisResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey
            },
            body: formData
        });

        if (!analysisResponse.ok) {
            const errorData = await analysisResponse.json();
            throw new Error(`Azure API Error: ${errorData.error ? errorData.error.message : analysisResponse.statusText}`);
        }

        // Get the operation location from the response headers
        const operationLocation = analysisResponse.headers.get('Operation-Location');
        if (!operationLocation) {
            throw new Error('Operation-Location header not found in the response.');
        }

        // Poll the operation until it's complete
        let result;
        let isCompleted = false;
        
        while (!isCompleted) {
            // Wait for 1 second before polling again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check the status of the operation
            const statusResponse = await fetch(operationLocation, {
                method: 'GET',
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey
                }
            });

            if (!statusResponse.ok) {
                const errorData = await statusResponse.json();
                throw new Error(`Azure API Error: ${errorData.error ? errorData.error.message : statusResponse.statusText}`);
            }

            result = await statusResponse.json();
            
            // Check if the operation is completed
            if (result.status === 'succeeded') {
                isCompleted = true;
            } else if (result.status === 'failed') {
                throw new Error(`Document analysis failed: ${result.error ? result.error.message : 'Unknown error'}`);
            }
        }

        return result;
    }    
    
    function displayResults(results) {
        // Clear previous results
        resultsTableBody.innerHTML = '';
        
        // Check if results is already in the expected format (like pasted JSON)
        if (Array.isArray(results) && results.length > 0 && results[0].fields) {
            // Handle direct JSON input
            processExtractedItems(results[0]);
            return;
        }
        
        // Handle results from API
        if (results.analyzeResult && results.analyzeResult.documents) {
            const documentResults = results.analyzeResult.documents;
            
            if (!documentResults || documentResults.length === 0) {
                showError('No data was extracted from the document.');
                return;
            }
    
            const extractedDocument = documentResults[0];
            processExtractedItems(extractedDocument);
        } else {
            showError('Invalid result format. Could not extract document data.');
        }
    }    
    
    function processExtractedItems(extractedDoc) {
        // Check if the document has Item field with an array
        if (extractedDoc.fields && extractedDoc.fields.Items && extractedDoc.fields.Items.valueArray) {
            // Get the first item to determine available fields
            const firstItem = extractedDoc.fields.Items.valueArray[0];
            
            // Create table header for items with specified order
            const headerRow = document.createElement('tr');
            
            // Define preferred order for headers
            const preferredOrder = ['Name', 'Commodity', 'Length', 'Width', 'Height', 'Dimension', 'Quantity', 'Volume', 'GrossWeight', 'NetWeight'];
            
            // Get available fields from the data
            let availableFields = [];
            if (firstItem && firstItem.valueObject) {
                availableFields = Object.keys(firstItem.valueObject);
            }
            
            // Create final headers array: first add preferred headers that exist in the data, then add any remaining fields
            let headers = [];
            
            // First add fields from preferred order that exist in the data
            preferredOrder.forEach(field => {
                if (availableFields.includes(field)) {
                    headers.push(field);
                }
            });
            
            // Then add any remaining fields that weren't in the preferred order
            availableFields.forEach(field => {
                if (!preferredOrder.includes(field)) {
                    headers.push(field);
                }
            });
            
            // If no headers were found, use a subset of preferred headers as fallback
            if (headers.length === 0) {
                headers = ['Name', 'Commodity', 'Length', 'Dimension', 'Quantity', 'GrossWeight', 'NetWeight'];
            }
            
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            // Clear and set new headers
            resultsTableBody.parentElement.querySelector('thead').innerHTML = '';
            resultsTableBody.parentElement.querySelector('thead').appendChild(headerRow);
            
            // If headers don't include Width or Height but we have Dimension, add them
            const dimensionHeaderIndex = headers.indexOf('Dimension');
            if (dimensionHeaderIndex >= 0) {
                if (!headers.includes('Width')) {
                    // Insert Width after Length or after Dimension if Length is not present
                    const lengthIndex = headers.indexOf('Length');
                    if (lengthIndex >= 0) {
                        headers.splice(lengthIndex + 1, 0, 'Width');
                    } else {
                        headers.splice(dimensionHeaderIndex, 0, 'Width');
                    }
                }
                
                if (!headers.includes('Height')) {
                    // Insert Height after Width
                    const widthIndex = headers.indexOf('Width');
                    if (widthIndex >= 0) {
                        headers.splice(widthIndex + 1, 0, 'Height');
                    } else {
                        // Insert after Length if Width is not present
                        const lengthIndex = headers.indexOf('Length');
                        if (lengthIndex >= 0) {
                            headers.splice(lengthIndex + 1, 0, 'Height');
                        } else {
                            headers.splice(dimensionHeaderIndex, 0, 'Height');
                        }
                    }
                }
                
                // Rebuild the header row with the new headers
                headerRow.innerHTML = '';
                headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    headerRow.appendChild(th);
                });
            }
            
            // Define numeric fields that should be cleaned
            const numericFields = ['Length', 'Width', 'Height', 'Quantity', 'Volume', 'GrossWeight', 'NetWeight'];
            
            // Process each item in the array
            extractedDoc.fields.Items.valueArray.forEach((item, index) => {
                if (item.valueObject) {
                    const row = document.createElement('tr');
                    
                    // First, check if we have a Dimension field that needs to be parsed
                    let dimensionValues = null;
                    if (item.valueObject['Dimension']) {
                        const dimensionData = item.valueObject['Dimension'];
                        let dimensionStr = '';
                        
                        if (dimensionData.valueString) {
                            dimensionStr = dimensionData.valueString;
                        } else if (dimensionData.content) {
                            dimensionStr = dimensionData.content;
                        }
                        
                        if (dimensionStr) {                            
                            // Remove unwanted spaces between numbers, units, and 'x' separators
                            dimensionStr = dimensionStr
                                .trim()
                                .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')  // Fix spaces in decimal numbers
                                .replace(/(\d+(?:\.\d+)?)\s*(mm|cm|m|MM|CM|M)/gi, '$1$2') // Remove space between number and unit
                                .replace(/([a-z0-9])\s*[xX×\*]\s*([a-z0-9])/gi, '$1x$2'); // Normalize all separators to 'x'
                            
                            // Extract numbers from dimension string
                            dimensionValues = extractDimensionValues(dimensionStr);
                            
                            // Ensure we're working with an array
                            if (!Array.isArray(dimensionValues)) {
                                dimensionValues = [];
                            }
                        }
                    }
                    
                    // Create an object to store the values we'll display
                    const rowValues = {};
                    
                    // First pass - collect existing values
                    headers.forEach(field => {
                        const fieldData = item.valueObject[field];
                        if (fieldData) {
                            let value = '';
                            if (fieldData.valueString) {
                                value = fieldData.valueString;
                            } else if (fieldData.valueNumber !== undefined) {
                                value = fieldData.valueNumber.toLocaleString();
                            } else if (fieldData.content) {
                                value = fieldData.content;
                            }
                            
                            // Special handling for weight fields
                            if (field === 'GrossWeight' || field === 'NetWeight') {
                                // First trim and normalize spaces
                                value = value.trim().replace(/\s+/g, ' ');
                                
                                // Fix decimal notation with spaces (e.g., "3. 1412" → "3.1412")
                                value = value.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');
                            }
                            
                            if (numericFields.includes(field)) {
                                value = cleanNumericValue(value);
                            }
                            
                            rowValues[field] = {
                                value: value,
                                original: fieldData.valueString || fieldData.content || '',
                                confidence: fieldData.confidence
                            };
                        }
                    });
                    
                    // Always populate dimension values if available - not just for missing fields
                    if (dimensionValues && dimensionValues.length > 0) {
                        
                        // Keep track of which dimension values we've used
                        let nextDimValueIndex = 0;
            
                        // Modify how we check for empty columns - first initialize all dimension columns to ensure they exist
                        if (headers.includes('Width')) {
                            if (!rowValues['Width']) {
                                rowValues['Width'] = { value: 'N/A', isEmpty: true };
                            }
                        }
                        
                        if (headers.includes('Height')) {
                            if (!rowValues['Height']) {
                                rowValues['Height'] = { value: 'N/A', isEmpty: true };
                            }
                        }
                        
                        // Use a simpler sequential approach - only assign to empty fields
                        let dimensionIndex = 0; // Track which dimension value we're using
                        
                        // Check all dimension fields in order and only fill empty ones
                        const dimensionFields = ['Length', 'Width', 'Height'];
                        
                        for (const field of dimensionFields) {
                            if (headers.includes(field)) {
                                // Improved check for empty fields - check for empty strings too
                                if (rowValues[field] && 
                                    rowValues[field].value !== 'N/A' && 
                                    rowValues[field].value !== '' && 
                                    !rowValues[field].isEmpty) {
                                    continue;
                                }
                                
                                // Check if we have any dimension values left
                                if (dimensionIndex < dimensionValues.length) {
                                    rowValues[field] = {
                                        value: dimensionValues[dimensionIndex],
                                        original: `Derived from Dimension: ${item.valueObject['Dimension']?.valueString || item.valueObject['Dimension']?.content}`,
                                        derived: true
                                    };
                                    dimensionIndex++;
                                } else {
                                    if (!rowValues[field]) {
                                        rowValues[field] = { value: 'N/A', isEmpty: true };
                                    }
                                }
                            }
                        }
                    }
                    
                    // Third pass - create table cells with the collected values
                    headers.forEach(field => {
                        const cell = document.createElement('td');
                        cell.setAttribute('contenteditable', 'true'); // Make cells editable
                        
                        if (rowValues[field]) {
                            cell.textContent = rowValues[field].value || 'N/A';
                            
                            if (rowValues[field].derived) {
                                cell.title = rowValues[field].original;
                                cell.classList.add('derived-value');
                                cell.style.backgroundColor = '#f0f8ff'; // Light blue background for derived values
                            } else if (rowValues[field].original) {
                                cell.title = `Original: ${rowValues[field].original}`;
                                if (rowValues[field].confidence) {
                                    cell.title += ` | Confidence: ${(rowValues[field].confidence * 100).toFixed(2)}%`;
                                }
                            }
                        } else {
                            cell.textContent = 'N/A';
                        }
                        
                        // Add event listeners for editing
                        cell.addEventListener('focus', function() {
                            this.dataset.before = this.textContent;
                            this.classList.add('editing');
                        });
                        
                        cell.addEventListener('blur', function() {
                            if (this.dataset.before !== this.textContent) {
                                this.classList.add('edited');
                                // Optional: Add visual indication that the cell was edited
                            }
                            this.classList.remove('editing');
                        });
                        
                        // Prevent line breaks in table cells
                        cell.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                this.blur();
                            }
                        });
                        
                        row.appendChild(cell);
                    });
                    
                    resultsTableBody.appendChild(row);
                }
            });
        } else {
            // Fallback to generic field display
            const fields = extractedDoc.fields;
            
            // Display each field in the table
            for (const [fieldName, fieldData] of Object.entries(fields)) {
                const row = document.createElement('tr');
                
                const nameCell = document.createElement('td');
                nameCell.textContent = fieldName;
                
                const valueCell = document.createElement('td');
                // Format the value based on its type
                if (fieldData.value !== null && fieldData.value !== undefined) {
                    let displayValue;
                    
                    if (typeof fieldData.value === 'object' && fieldData.valueType === 'date') {
                        displayValue = new Date(fieldData.value).toLocaleDateString();
                    } else if (typeof fieldData.value === 'object' && fieldData.valueType === 'array') {
                        displayValue = JSON.stringify(fieldData.value);
                    } else {
                        displayValue = fieldData.value.toString();
                        
                        // Clean numeric values for fields that likely contain numbers
                        if (fieldName.toLowerCase().includes('length') || 
                            fieldName.toLowerCase().includes('width') || 
                            fieldName.toLowerCase().includes('height') ||
                            fieldName.toLowerCase().includes('weight') ||
                            fieldName.toLowerCase().includes('quantity') ||
                            fieldName.toLowerCase().includes('volume')) {
                            displayValue = cleanNumericValue(displayValue);
                        }
                    }
                    
                    valueCell.textContent = displayValue;
                    valueCell.title = `Original: ${fieldData.value.toString()}`;
                } else {
                    valueCell.textContent = 'N/A';
                }
                
                const confidenceCell = document.createElement('td');
                confidenceCell.textContent = fieldData.confidence ? (fieldData.confidence * 100).toFixed(2) + '%' : 'N/A';
                
                row.appendChild(nameCell);
                row.appendChild(valueCell);
                row.appendChild(confidenceCell);
                
                resultsTableBody.appendChild(row);
            }
        }
        
        // Add drag-and-drop functionality to table headers
        setupTableHeaderDragAndDrop();
    }

    // Helper function to extract dimension values
    function extractDimensionValues(dimensionStr) {
        // Look for common dimension formats like:
        // "0.700MMx1219MMxCOIL" or "1.2x2.4x3.5" or "1200mmx800mmx144mm" or "18130*3000*4000"
        
        // Strip any letters at the beginning that might confuse the pattern
        dimensionStr = dimensionStr.replace(/^[a-zA-Z\s]+/, '');
        
        // Try multiple approaches to extract dimension values
        let numbers = [];
        
        // Approach 1: Look for dimension pattern with unit and various separators
        const dimensionPattern = /(\d+(?:[.,]\d+)?)\s*(?:MM|CM|M|mm|cm|m)?(?:\s*[xX×\*]\s*|$)/g;
        let match;
        
        while ((match = dimensionPattern.exec(dimensionStr)) !== null && numbers.length < 3) {
            numbers.push(match[1]);
        }
        
        // Approach 2: If first approach didn't work, try splitting by common separators
        if (numbers.length === 0) {
            // Try to split by common separators and extract numbers
            const parts = dimensionStr.split(/[xX×\*]/);
            numbers = parts
                .map(part => {
                    const match = part.match(/\d+(?:[.,]\d+)?/);
                    return match ? match[0] : null;
                })
                .filter(Boolean)
                .slice(0, 3);
        }
        
        // Approach 3: Last resort, just extract all numbers
        if (numbers.length === 0) {
            const simpleNumbers = dimensionStr.match(/\d+(?:[.,]\d+)?/g);
            if (simpleNumbers && simpleNumbers.length > 0) {
                numbers = simpleNumbers.slice(0, 3);
            }
        }
        
        return numbers.length > 0 ? numbers : null;
    }

    // Helper function to clean numeric values
    function cleanNumericValue(value) {
        if (typeof value !== 'string' && typeof value !== 'number') {
            return value;
        }
        
        const valueStr = value.toString();
        
        // Special handling for weight fields (GrossWeight and NetWeight)
        if (valueStr.toLowerCase().includes('weight') || 
            valueStr.toLowerCase().includes('kg') || 
            valueStr.toLowerCase().includes('ton')) {
            
            // First, try to clean up decimal notation (e.g., "3. 1412" → "3.1412")
            let cleanedValue = valueStr
                .replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2')  // Fix "3. 1412" to "3.1412"
                .replace(/,/g, '.');  // Replace commas with dots for decimal
            
            // Then extract the number part
            const numMatch = cleanedValue.match(/([\d.]+)/);
            if (numMatch) {
                const number = numMatch[0];
                
                // Try to find a unit (kg, mt, ton, etc.)
                const unitMatch = cleanedValue.match(/(?:kg|mt|ton|t)/i);
                const unit = unitMatch ? unitMatch[0].trim() : '';
                
                // Return properly formatted weight
                return unit ? `${number} ${unit}` : number;
            }
            
            return valueStr; // If all else fails, return original
        }
        
        // Extract numbers (including decimal points and commas as part of the number)
        const matches = valueStr.match(/\d+([.,]\d+)?/g);
        
        if (!matches || matches.length === 0) {
            return value; // Return original if no numbers found
        }
        
        // Join multiple numbers with spaces if there are multiple matches
        return matches.join(' ');
    }

    function showLoading(isLoading) {
        loadingIndicator.classList.toggle('hidden', !isLoading);
    }

    function showResults() {
        resultsSection.classList.remove('hidden');
    }

    function hideResults() {
        resultsSection.classList.add('hidden');
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }
});

// Add the following code to handle the drag & drop functionality
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('documentInput');
    const selectImageBtn = document.getElementById('selectImageBtn');
    
    // Re-initialize the drag and drop functionality
    function initDragAndDrop() {
        // Get updated reference to upload area (it might have changed)
        const currentUploadArea = document.getElementById('uploadArea');
        if (!currentUploadArea) return;
        
        // Clear any existing event listeners by cloning
        const newUploadArea = currentUploadArea.cloneNode(true);
        if (currentUploadArea.parentNode) {
            currentUploadArea.parentNode.replaceChild(newUploadArea, currentUploadArea);
        }
        
        // Update the selectImageBtn click handler
        const newSelectBtn = newUploadArea.querySelector('#selectImageBtn');
        if (newSelectBtn) {
            newSelectBtn.addEventListener('click', function() {
                fileInput.click();
            });
        }
        
        // Re-attach all drag & drop event handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            newUploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            newUploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            newUploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        // Add explicit drop handler
        newUploadArea.addEventListener('drop', handleDrop, false);
        
        console.log('Drag and drop re-initialized');
        return newUploadArea;
    }
    
    // Initialize on page load
    initDragAndDrop();
    
    // Handle click on "Select Image" button
    selectImageBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Handle file selection via the input element
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            const mainScope = document.querySelector('body').__mainScope;
            if (mainScope && mainScope.handleFile) {
                mainScope.handleFile(fileInput.files[0]);
                // Reinitialize drag & drop after the UI changes
                setTimeout(initDragAndDrop, 100);
            }
        }
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        console.log('Drag entered upload area');
        document.getElementById('uploadArea').classList.add('dragover');
    }
    
    function unhighlight(e) {
        console.log('Drag left upload area');
        document.getElementById('uploadArea').classList.remove('dragover');
    }
    
    function handleDrop(e) {
        console.log('File dropped');
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            const file = dt.files[0];
            console.log('Dropped file:', file.name);
            
            // Update the file input with the dropped file
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            // Process the file using the main scope
            const mainScope = document.querySelector('body').__mainScope;
            if (mainScope && mainScope.handleFile) {
                mainScope.handleFile(file);
                // Reinitialize drag & drop after the UI changes
                setTimeout(initDragAndDrop, 100);
            }
        }
    }
});

// Store the handleFile function on the document body to make it accessible across event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Create a scope for main functions
    document.querySelector('body').__mainScope = {
        handleFile: function(file) {
            // Get references to elements
            const uploadArea = document.getElementById('uploadArea');
            const processButton = document.getElementById('processButton');
            
            // Display the selected filename
            const fileName = file.name;
            uploadArea.innerHTML = `<p>Selected file: ${fileName}</p>`;
            
            // Show the process button since we have a file
            processButton.classList.remove('hidden');
            
            // If file is a ZIP, update the UI to reflect that
            if (file.name.toLowerCase().endsWith('.zip')) {
                uploadArea.innerHTML = `
                    <div class="upload-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 12V8H16V2H8v6H2v14h20V12zM16 16H8v-4h8v4z"/>
                        </svg>
                    </div>
                    <p>Selected ZIP file: ${fileName}</p>
                `;
            } 
            // If it's a PDF or image, we could add specific icons for those too
            else if (file.name.toLowerCase().endsWith('.pdf')) {
                uploadArea.innerHTML = `
                    <div class="upload-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    </div>
                    <p>Selected PDF file: ${fileName}</p>
                `;
            } else {
                // For other file types
                uploadArea.innerHTML = `
                    <div class="upload-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                    </div>
                    <p>Selected file: ${fileName}</p>
                `;
            }
        }
    };
});
