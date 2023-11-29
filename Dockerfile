# Use an official Node runtime as a parent image
FROM node:20.10.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle your app's source code inside the Docker image
COPY . .

# Make port available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV PORT=3000
ENV DB_HOST=77.72.0.110
ENV DB_USER=landscap_sms
ENV DB_PASSWORD=B6I,qq&1,4T6
ENV DB_DATABASE=landscap_sms
ENV DB_PORT=3306
ENV SESSION_SECRET=som4334ethinsdfsdfgso45dfgsdfme234234inthsdfsdfi43ngsecre2223t
ENV INCORPORATION_YEAR=2014
ENV ADMIN_PASSWORD=adminpassword
ENV ADMIN_USERNAME=admin

# Run app.js when the container launches
CMD ["node", "app.js"]
