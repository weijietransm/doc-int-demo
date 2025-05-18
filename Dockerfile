FROM nginx:alpine

# Copy the static files to the nginx html directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Create and copy the samples directory
RUN mkdir -p /usr/share/nginx/html/samples
COPY samples/ /usr/share/nginx/html/samples/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
