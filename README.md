# Document Intelligence Custom Extraction Web App

This web application allows you to process documents using Azure Document Intelligence Custom Extraction Model and display the extracted data in a table format. The data can also be downloaded as a CSV file.

## Docker Instructions

### Building the Docker Image

To build the Docker image, run the following command in the project directory:

```bash
docker build -t doc-intelligence-app .
```

### Running the Docker Container

To run the application in a Docker container:

```bash
docker run -d -p 8080:80 --name doc-intelligence-container doc-intelligence-app
```

This will start the container and map port 8080 on your host to port 80 in the container.

### Accessing the Application

Once the container is running, you can access the application by opening your web browser and navigating to:

```
http://localhost:8080
```

### Stopping the Container

To stop the running container:

```bash
docker stop doc-intelligence-container
```

### Removing the Container

To remove the stopped container:

```bash
docker rm doc-intelligence-container
```

## Application Usage

1. Enter your Azure Document Intelligence credentials (endpoint, API key, and model ID)
2. Upload a document (PDF, JPG, PNG, etc.)
3. Click "Process Document" to extract data
4. View the extracted data in the table
5. Download the results as a CSV file by clicking "Download as CSV"

## Security Note

The application stores Azure credentials in the browser during your session. Be careful when using this application on shared computers.
