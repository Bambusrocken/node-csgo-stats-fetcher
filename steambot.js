const steamUser = require('steam-user');
const globalOffensive = require('globaloffensive');
const request = require('request');
const config = require('./config.json');

const client = new steamUser();
const csgo = new globalOffensive(client);
const logOnOptions = {
    accountName: config.accountName,
    password: config.password
};

var queueIndex = -1;
const accountsToLookUp = [
    { steamid : '76561198034821979' }, // Chilco
    { steamid : '76561198170561354' }, // Vin Diezel
    { steamid : '76561198201294963' }, // Din Viezel
    { steamid : '76561198246968446' }  // Boktor
];

client.logOn(logOnOptions);
client.on('loggedOn', function() {
    console.log('Logged into Steam.');
    client.setPersona(steamUser.EPersonaState.Online);
    client.gamesPlayed([730]);
});

csgo.on('connectedToGC', function () {
    console.log('Connected to Game Coordinator.');
    startFetchingAllPlayerStats();
    setInterval(startFetchingAllPlayerStats, config.STATS_CHECK_DELAY);
});

function startFetchingAllPlayerStats() {
    queueIndex = -1;
    getNameAndAvatarOfAccounts();
    fetchAllPlayerStats();
}

function getNameAndAvatarOfAccounts() {
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

function fetchAllPlayerStats() {
    queueIndex ++;
    if (queueIndex >= accountsToLookUp.length) {
        queueIndex = -1;
        return;
    }

    console.log('Fetching: ' + accountsToLookUp[queueIndex].steamid + '...');
    csgo.requestPlayersProfile(accountsToLookUp[queueIndex].steamid, function(response) {
        updateCSGOStats(accountsToLookUp[queueIndex].steamid, response);
    });
    setTimeout(fetchAllPlayerStats, config.REQUEST_DELAY);
}

function updateCSGOStats(steamid, data) {
    accountsToLookUp[queueIndex].steamid = steamid;
    accountsToLookUp[queueIndex].rank = data.ranking.rankId;
    accountsToLookUp[queueIndex].wins = data.ranking.wins;
    accountsToLookUp[queueIndex].updateDate = new Date();

    request.post({
        url: config.REST_ENDPOINT_URL,
        json: accountsToLookUp[queueIndex]
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
    })
}