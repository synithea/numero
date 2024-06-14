const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const wait = require(`node:timers/promises`).setTimeout;

// This command provides a randomly selected personal best of a designated user.
// Users can leave the `target` blank to randomly select from their own personal bests

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rpb')
        .setDescription("Display pb from a random map, filterable for any map at or below a certain rank!")
        .addUserOption(option =>
            option.setName("target")
            .setDescription("The player you want to randomly find a pb of - Leave blank for yourself!"))
        .addIntegerOption(option => 
            option.setName("bestrank")
            .setDescription("The highest possible rank the player can have on the randomly chosen map")),
    async execute(interaction, bot) {
        await interaction.deferReply();

        //Create required variables
        const caller = [interaction.user, interaction.member];
        const callerName = caller[1].nickname === null ? caller[0].username : caller[1].nickname;

        let targetO = interaction.options.get("target");
        let target = targetO === null ? caller : [targetO.user, targetO.member];
        const targetName = target[1].nickname === null ? target[0].username : target[1].nickname;

        let max = interaction.options.getInteger("bestrank");
        if (max == null) max = 0;

        let chosen = "";
        if (max > 1)
        {
            let maps = await gatherMaps(max, target[0].id, bot);
            if (maps[0] == undefined) return interaction.reply(`${targetName} does not have any pb's that are worse than ${max}`);
            chosen = maps[Math.floor(Math.random()*maps.length)].toLowerCase();
        } else {
            chosen = bot.levels[Math.floor(Math.random()*115)].actualName.toLowerCase();
        }

        let pbInfo = await getPB(target, chosen, bot)
        if (pbInfo == 402) return interaction.editReply(`${targetName} was not top 200 on the randomly chosen map ${chosen}`)

        let embed = await createEmbed(callerName, targetName, pbInfo)

        await interaction.editReply({content: ``, embeds: [embed]});
    },
};


async function gatherMaps(maxRank, id, bot)
{
    let maps = []
    for(let map of bot.pbs)
    {
        for(let player of map.lb)
        {
            if (player.rank < maxRank)
            {
                if (player.discordId == id) break;
                continue;
            }
            maps[maps.length] = map.levelName
            break;
        }
    }

    await wait(50);
    return maps;
}

async function createEmbed(callerName, targetName, pbInfo)
{
    let embed = new EmbedBuilder()
        .setColor(`#${pbInfo.color}`)
        .setTitle(`${targetName} pb on ${pbInfo.level} - requested by ${callerName}`)
        .addFields(
            { name: "Time set", value: `${pbInfo.time/1000}`, inline: true},
            { name: "Rank", value: `${pbInfo.rank}`, inline: true},
            { name: "Points earned", value: `${pbInfo.points}`, inline: true},
            { name: "​", value: "​", inline: true},
            { name: "Date set", value: `${pbInfo.date}`, inline: true},
            { name: "​", value: "​", inline: true}
        ).setFooter({text: `This Level was Last Updated:`})
        .setTimestamp(new Date(pbInfo.lastUpdated));

    return embed;
}

async function getPB(target, level, bot)
{
    let info = {"time": 0, "rank": 0, "points": 0, "date": 0, "level": '', "color": "", "lastUpdated": 0};
    let i = 0;
    let status = 402;
    for (let l in bot.levels)
    {
        if(bot.levels[l].nameList.includes(level.toLowerCase()) || bot.levels[l].actualName.toLowerCase() == level.toLowerCase()) 
        {
            info.level = bot.levels[l].actualName;
            i = l;
            break;
        }
    }

    if (bot.pbs[i].lastUpdated != undefined || bot.pbs[i].lastUpdated != null) info.lastUpdated = bot.pbs[i].lastUpdated;

    for (let p of bot.pbs[i].lb)
    {
        if(target[0].id == p.discordId)
        {
            info.time = p.time;
            info.rank = p.rank;
            info.points = p.points;
            info.date = p.when.split("T")[0];
            info.color = p.color;
            status = 200;
            break;
        }
    }

    if (info.color == "") info.color = "00ffff";

    if (status == 200) return info;
    return status
}