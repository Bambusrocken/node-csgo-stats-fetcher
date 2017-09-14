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
2. Run `npm update` from your terminal
3. Rename `example.config.json` to `config.json` and modify it with your account credentials, Steam API key, REST Endpoint URL to which the data needs to be sent and the accounts from which the CS:GO statistics are to be looked up from.
4. Run `node steambot.js` to execute the script

# Data structure
Below is an example of the data structure that is sent to the specified endpoint:
```json
{ 
    "steamid" : "76561198201294963",
    "avatar" : "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatar/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
    "name" : "Din Viezel",
    "rank" : 14,
    "wins" : 164,
    "updateDate" : "2016-12-12T21:25:11.268Z"
}
```
