const steamUser = require('steam-user');
const globalOffensive = require('globaloffensive');
const request = require('request');
const config = require('./config.json');

const client = new steamUser();
const csgo = new globalOffensive(client);
const logOnOptions = {
    accountName: config.STEAM_ACCOUNT.name,
    password: config.STEAM_ACCOUNT.password
};
const accountsToLookUp = config.ACCOUNTS_TO_LOOKUP;
var queueIndex = -1;

client.logOn(logOnOptions);
client.on('loggedOn', function() {
    console.log('> Logged into Steam with', logOnOptions.accountName);
    client.setPersona(steamUser.EPersonaState.Offline);
    client.gamesPlayed([730]);
});

csgo.on('connectedToGC', function () {
    console.log('> Connected to Game Coordinator');
    startFetchingData();
});

/**
 * Start fetching all CS:GO data of all accounts that are configured to be looked up.
 */
function startFetchingData() {
    fetchAllPlayerNamesAndAvatars();
    fetchAllPlayerGameStatistics();
}

/**
 * Fetches all names and avatars of all accounts that are configured to be looked up.
 */
function fetchAllPlayerNamesAndAvatars() {
    function makeSteamIdsString() {
        var steamids = '';
        for (var i = 0; i < accountsToLookUp.length; i++) {
            steamids += accountsToLookUp[i].steamid;

            if (accountsToLookUp[i + 1] != undefined)
                steamids += ',';
        }
        return steamids;
    }

    request.get({
        url: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+ config.STEAM_API_KEY + '&steamids=' + makeSteamIdsString(),
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            for(var i = 0; i < body.response.players.length; i++) {
                for(var i2 = 0; i2 < accountsToLookUp.length; i2++) {
                    if(accountsToLookUp[i2].steamid == body.response.players[i].steamid) {
                        accountsToLookUp[i2].avatar = body.response.players[i].avatarfull;
                        accountsToLookUp[i2].name = body.response.players[i].personaname;
                    }
                }
            }
        }
    });
}

/**
 * Recursively fetches all game statistics of all accounts that are configured to be looked up.
 */
function fetchAllPlayerGameStatistics() {
    queueIndex ++;
    if (queueIndex >= accountsToLookUp.length) {
        queueIndex = -1;
        setTimeout(startFetchingData, config.STATS_CHECK_DELAY); // The STATS_CHECK_DELAY is the interval
        return;
    }

    var currentlyFetchingSteamId = accountsToLookUp[queueIndex].steamid;

    console.log('> Fetching CS:GO statistics of steamid: ' + currentlyFetchingSteamId + '...');
    csgo.requestPlayersProfile(accountsToLookUp[queueIndex].steamid, function(response) {
        postPlayerGameStatistics(currentlyFetchingSteamId, response);
    });
    setTimeout(fetchAllPlayerGameStatistics, config.TIME_INBETWEEN_ACCOUNT_LOOKUPS);
}

/**
 * Sends a POST request with account data to the configured REST endpoint.
 * @param {Number} steamid
 * @param {Object} data
 */
function postPlayerGameStatistics(steamid, data) {
    accountsToLookUp[queueIndex].steamid = steamid;
    accountsToLookUp[queueIndex].rank = data.ranking.rankId;
    accountsToLookUp[queueIndex].wins = data.ranking.wins;
    accountsToLookUp[queueIndex].updateDate = new Date();

    request.post({
        url: config.REST_ENDPOINT_URL,
        json: accountsToLookUp[queueIndex]
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('>', body.message);
        } else {
            console.log('> Failed to POST game statistics of steamid:', steamid);
        }
    })
}