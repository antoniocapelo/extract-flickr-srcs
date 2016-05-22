# Extract flickr srcs

Simple node utility for extracting the latest flickr public photos from a user.

## Usage

In order to use this utility, provide:

* flickr API Key
* API Secret
* User ID either

as an argument or as a **environment variable**:


    node src/index.js --FLICKR_API_KEY=... --FLICKR_SECRET=... --FLICKR_USER_ID=... > output.html

The default number of results is 50 but that can be defined as a parameter also (``NUM_RESULTS``).

## Template

The template be adapted to any need, just change the template.js module to your need.

