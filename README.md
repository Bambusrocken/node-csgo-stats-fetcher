# node-csgo-stats-fetcher
A bot on Steam that fetches CS:GO statistics of specified accounts.
The received data is sent to a webserver using a REST call.

# Requirements
* node-steam-user
* node-globaloffensive
* request
* CS:GO must be purchased on the account you sign in with

# Installation:
1. Download this package
2. Run `npm install` from your terminal
3. Rename example.config.json to config.json and modify it with your account credentials, Steam API key and REST Endpoint URL to which the data needs to be sent.
