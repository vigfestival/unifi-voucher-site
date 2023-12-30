#
# Define OS
#
FROM python:alpine

#
# Basic OS management
#

# Install packages
RUN apk add --no-cache nodejs npm
RUN apk update && apk add --virtual build-dependencies build-base gcc wget git

RUN apk add jpeg-dev zlib-dev
ENV LIBRARY_PATH=/lib:/usr/lib

RUN pip install --upgrade pip
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
