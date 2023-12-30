#
# Define OS
#
#FROM nikolaik/python-nodejs:latest
FROM nikolaik/python-nodejs:python3.8-nodejs18-alpine
#
# Basic OS management
#

# Install packages
#RUN apt-get update && apt-get install -y build-essential
RUN apk update && apk add --virtual build-dependencies build-base gcc wget git

RUN pip install --upgrade brother_ql

#
# Require app
#

# Create app directory
WORKDIR /app

# Bundle app source
COPY . .

# Install dependencies
RUN npm ci --only=production

# Create production build
RUN npm run build

#
# Setup app
#

# Expose app
EXPOSE 3000

# Set node env
ENV NODE_ENV=production

# Run app
CMD ["node", "/app/server.js"]
