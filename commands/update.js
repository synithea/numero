const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const wait = require(`node:timers/promises`).setTimeout;
const fs = require("fs");
const tempRes = require(`../data/pulledData.json`);

var pulledData = tempRes;

var myHeaders = new Headers();
myHeaders.append("x-bc-secret", "1");
myHeaders.append("Content-Type", "application/json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription("Updates the information for all the commands for the selected level!")
        .addStringOption(option =>
            option.setName('levelname')
                .setDescription("The level you wish to chose")
                .setRequired(true)),
    async execute(interaction, bot) {
        
        const level = interaction.options.getString("levelname");
        console.log(`Updating ${level}`);

        //Post message informing that Update has started
        await interaction.reply("Updating level please wait!");

        let index = -1;
        let ID;

        for (let l in bot.levels)
        {
            if(bot.levels[l].nameList.includes(level.toLowerCase()) || bot.levels[l].actualName.toLowerCase() == level.toLowerCase()) 
            {
                ID = bot.levels[l].id
                index = l;
            }
        }

        if (index == -1) return await interaction.editReply("Level not found, no update performed!");

        // Pull 200 records on the selected level.
        // This is done in two batches of 100

        // await updateLevel(level, bot); // Testing Function for this entire sequence

        await pullLevelFirstPage(ID, index, bot);
        await pullLevelSecondPage(ID, index, bot);

        await interaction.editReply("First 200 records on selected level pulled and merged together");

        //Regex the data (stupid <color="#ffffff"> people)
        await regexData(bot, index, start);
        await interaction.editReply("All records regexed!");

        // Removes all stat data from old pb's for selected map
        // New data added in later
        await removeOldScoreData(index, bot);

        //Score all 200 records for the selected level, and save them as the
        //PB for the individual (only stores top 200 pb's for each map)   
        await scoreNewData(pulledData[index], index, bot);

        // Adds new stat data for anyone that has a pb after the update!
        // This replaces the data removed earlier
        await addNewScoreData(index, bot);
        await interaction.editReply("All records scored & stored!");
        
        //Update all files that are stored in case of outages.
        await updateFiles(bot);
        await interaction.editReply("Update completed!");
    },
};

// This function is no longer used, but is my testing function. Use this to avoid cluttering above when testing.
async function updateLevel(level, bot)
{
    let index;
    let ID;

    for (let l in bot.levels)
    {
        if(bot.levels[l].nameList.includes(level.toLowerCase()) || bot.levels[l].actualName.toLowerCase() == level.toLowerCase()) 
        {
            ID = bot.levels[l].id
            index = l;
        }
    }

    await pullLevelFirstPage(ID, index, bot);
    await pullLevelSecondPage(ID, index, bot);
    await regexData(bot, index);
    await removeOldScoreData(levelIndex, bot);
    await scoreNewData(pulledData[index].lb, index, bot);
    await addNewScoreData(index, bot);
    await updateFiles(bot);
}

// Pull the first 100 records from the selected level
async function pullLevelFirstPage(levelID, index, bot)
{
    var raw = await JSON.stringify({
        "function": "lb_pull",
        "lb_shortcode": "sh_leaderboard_global",
        "lb_country": "",
        "lb_levelIDs": [levelID],
        "limit": "100",
        "page": `0`
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    await fetch(bot.updateData.url, requestOptions)
        .then(response => {return response.json()})
        .then(result => {pulledData[index] = result.data.response[0]})
        .catch(error => console.log('error ', error));
}

// Pull the second 100 records from the selected level
async function pullLevelSecondPage(levelID, index, bot)
{
    let responseData;

    var raw = await JSON.stringify({
        "function": "lb_pull",
        "lb_shortcode": "sh_leaderboard_global",
        "lb_country": "",
        "lb_levelIDs": [levelID],
        "limit": "100",
        "page": `1`
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    await fetch(bot.updateData.url, requestOptions)
        .then(response => {return response.json()})
        .then(result => {responseData = result.data.response[0]})
        .catch(error => console.log('error ', error));

    await push(responseData, index);
}

// Merge data from the two pulls into one data block
async function push(data, index)
{
    let i = 0;
    await data.forEach(t => 
    {
        pulledData[index][(100)+i] = t;
        i++
    });
    await wait(20);
}

// Creates player data, and uses associated functions to remove unwanted
// Player data (html tags, hex color codes, etc)
async function regexData(bot,index,startTime)
{
    let lbOBJ = {
        "levelName": bot.levels[index].actualName,
        "lastUpdated": startTime,
        "lb" : pulledData[index]
    };

    let i = 0;
    for (let player of lbOBJ.lb)
    {
        player.discordId ??= await userFix(bot, player.userID);

        let playerData = {
            "userID": player.userID,
            "discordId": player.discordId,
            "time": player.time,
            "userName": player.userName,
            "rank": player.rank,
            "when": "",
            "country": player.country,
            "color": "00FFFF"
        }

        playerData = await regexNameAndHexCode(playerData);
        playerData.when = await ExtractDateTime(player.when);

        pulledData[index][i] = playerData;
        i++;
    }

    pulledData[index] = lbOBJ;
}

//Adds discordID's for players who's stats are a bit borked
async function userFix(bot, player)
{
    for (let user of bot.userFix)
    {
        if (player == user.userID) 
        {
            return user.discordID;
        }
    }
    return "";
}

// Removes HTML tags from usernames, and assigns the correct
// Hex Color Code if the player set one via HTML tags
async function regexNameAndHexCode(player)
{
    let username = player.userName;
    let hexcolor = "";
    let nameR = "";
    let flag = 0;

    for(let c in username)
    {
        if (username[c] == '<') flag = 1;
        if (flag == 1 && username[c] == "#") flag = 2;
        if (flag == 2 && (username[c] != ">" && username[c] != "#")) hexcolor = hexcolor + username[c];
        if (flag == 0) nameR = nameR + username[c];
        if (username[c] == '>') flag = 0;
    }

    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(function (hex) {
            return hex + hex;
        }).join('');
    }

    player.userName = nameR;
    if (hexcolor != "") player.color = hexcolor;

    return player;
}

// Converts The timestamp on the pb from a UTC time to a MM/DD/YYYY timestamp
async function ExtractDateTime(timeSet)
{
    var date = new Date(timeSet);
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let year = date.getFullYear();

    return `${month}/${day}/${year}`;
}

// Removes old, incorrect information from stat list
async function removeOldScoreData(levelIndex, bot)
{
    /*
    *   For each player that has a PB on the selected level
    *   before the update, remove stats from their current
    *   statblock regarding that pb. This is done so that
    *   the stats don't have to be recalculated for all
    *   115 maps, and instead can just be recalculated
    *   for the selected map
    */
    for (let pb of bot.pbs[levelIndex].lb)
    {
        for (let player of bot.stats)
        {
            if (pb.userID != player.userID) continue;

            if (pb.rank == 1) player.wrs--;
            if (pb.rank <= 3) player.topThrees--;
            if (pb.rank <= 10) player.topTens--;

            player.points -= pb.points;

            break;
        }
    }
}

// Score the new data for the selected level
async function scoreNewData(m_mapData, levelIndex, bot)
{
    /*
    *   Set variables for easy typing for 
    *   the places of: 1st, 10th, 50th, 200th
    */
    let mapData = m_mapData;
    let lbData = mapData.lb;

    let wr = lbData[0].time;
    let ten = lbData[9].time;
    let fifty = lbData[49].time;
    let last = lbData[199].time;

    // Calculate the various grading curves/slopes
    // Between the above times
    let slopes = slopesFunc(wr, ten, fifty, last);
    // let slope1 = slope(wr, ten, 9000);
    // let slope2 = slope(ten, fifty, 900);
    // let slope3 = slope(fifty, last, 90);

    let mod_lbData = lbData;

    // previousEntry is used for tie handling
    let previousEntry = {"time":0};
    
    for(let lbEntry of mod_lbData)
    {
        //Handle Ties the way racing does, if two players tie for
        //first, they both get first and the next player gets third
        if (lbEntry.time === previousEntry.time) lbEntry.rank = previousEntry.rank;

        //Give the player points based on their rank and appropriate
        //points curve/slope.
        if(lbEntry.rank<10)
        {
            lbEntry.points = calc(slopes[0],(lbEntry.time-wr),10000);
        }
        else if(lbEntry.rank<50)
        {
            lbEntry.points = calc(slopes[1],(lbEntry.time-ten),1000);
        }
        else
        {
            lbEntry.points = calc(slopes[2],(lbEntry.time-fifty),100);
        }

        previousEntry = lbEntry;
    }
    
    //Update the pbs for the Current level
    mapData.lb = mod_lbData;
    bot.pbs[levelIndex] = mapData;
}

// Adds new correct information to the stat list, replacing
// The removed data above.
async function addNewScoreData(levelIndex, bot)
{
    // For each PB in the selected level
    for (let pb of bot.pbs[levelIndex].lb)
    {
        let found = false;
        // Look through each player in the stat list
        // And add the appropriate points, and placement awards
        for (let player of bot.stats)
        {
            if (pb.userID != player.userID) continue;
            
            found = true;

            if (pb.rank == 1) player.wrs++;
            if (pb.rank <= 3) player.topThrees++;
            if (pb.rank <= 10) player.topTens++;

            player.points += pb.points;

            break;
        }
        if (found) continue;
        
        // If the player is not in the existing stat list,
        // Create a new stat block, and update it accordingly
        let statBlock = {
            "userID" : pb.userID,
            "userName": pb.userName,
            "discordId": pb.discordId,
            "points": pb.points,
            "wrs": 0,
            "topThrees": 0,
            "topTens": 0,
            "color": pb.color
        };

        if (pb.rank == 1) statBlock.wrs++;
        if (pb.rank <= 3) statBlock.topThrees++;
        if (pb.rank <= 10) statBlock.topTens++;

        // Add new stat block to the end of the stat list
        bot.stats[bot.stats.length] = statBlock;
    }
}

//This is as simple as it can be as I am updating all files on this method, each writeFile is the minimum needed.
async function updateFiles(bot)
{
    await fs.writeFile('./data/updateData.json', JSON.stringify(bot.updateData, null, 4), (err) => {if (err) throw err});
    await fs.writeFile('./data/pulledData.json', JSON.stringify(pulledData, null, 4), (err) => {if (err) throw err});
    await fs.writeFile(`./data/pbs.json`, JSON.stringify(bot.pbs, null, 4), (err) => {if (err) throw err});
    await fs.writeFile(`./data/stats.json`, JSON.stringify(bot.stats, null, 4), (err) => {if (err) throw err});
}

//Calculate the points slope between the best time in bracket,
//and the worst time in the bracket, while considering the difference
//in points
function slopesFunc(wr, ten, fifty, last)
{
    let slopes = [];
    slopes[0] = 9000/(wr-ten);
    slopes[1] = 900/(ten-fifty);
    slopes[2] = 90/(fifty-last);

    return slopes;
}

//Calculate the amount of points a specific time would get
//Given the respective slope, the difference in time, and
//Max number of points possible
function calc(slope, dT, max) {
    return Math.floor((slope*dT+max));
}