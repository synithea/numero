const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const wait = require(`node:timers/promises`).setTimeout;

// This command shows the current top 10 of a selected map.
// If the user chooses they can get a random map by leaving `levelname` blank

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top10')
        .setDescription("Get the top 10 for any map!")
        .addStringOption(option =>
            option.setName("levelname")
            .setDescription("The name of the level you want to see the top 10 of! - Leave blank for a random map!")
            .setRequired(false)),
    async execute(interaction, bot) {
        //Create required variables
        const caller = [interaction.user, interaction.member];
        const callerName = caller[1].nickname === null ? caller[0].username : caller[1].nickname;

        let level = interaction.options.getString("levelname");
        if (level == null) level = bot.levels[Math.floor(Math.random()*115)].actualName.toLowerCase();

        let top10 = await getTop10(level, bot);
        let embed = await createEmbed(callerName, top10);

        await interaction.reply({content: ``, embeds: [embed]});
    },
};

async function createEmbed(callerName, top10)
{
    let embed = new EmbedBuilder()
        .setColor(`#${top10.color}`)
        .setTitle(`Top 10 on ${top10.level} - requested by ${callerName}`)
        .addFields(
            { name: "​", value: "​", inline: true},
            { name: "World Record", value: `${top10.first.time} by ${top10.first.username}`, inline: true},
            { name: "​", value: "​", inline: true},
            { name: "Second", value: `${top10.second.time} by ${top10.second.username}`, inline: true},
            { name: "Third", value: `${top10.third.time} by ${top10.third.username}`, inline: true},
            { name: "Fourth", value: `${top10.fourth.time} by ${top10.fourth.username}`, inline: true},
            { name: "Fifth", value: `${top10.fifth.time} by ${top10.fifth.username}`, inline: true},
            { name: "Sixth", value: `${top10.sixth.time} by ${top10.sixth.username}`, inline: true},
            { name: "Seventh", value: `${top10.seventh.time} by ${top10.seventh.username}`, inline: true},
            { name: "Eighth", value: `${top10.eighth.time} by ${top10.eighth.username}`, inline: true},
            { name: "Ninth", value: `${top10.ninth.time} by ${top10.ninth.username}`, inline: true},
            { name: "Tenth", value: `${top10.tenth.time} by ${top10.tenth.username}`, inline: true}
        ).setFooter({text: `This Level was Last Updated:`})
        .setTimestamp(new Date(top10.lastUpdated));

    return embed;
}


async function getTop10(level, bot)
{
    let top10 = {"lastUpdated": 0, "color": "", "level": "", "first": {"time": 0, "username": ""},"second": {"time": 0, "username": ""},"third": {"time": 0, "username": ""},"fourth": {"time": 0, "username": ""},"fifth": {"time": 0, "username": ""},"sixth": {"time": 0, "username": ""},"seventh": {"time": 0, "username": ""},"eighth": {"time": 0, "username": ""},"ninth": {"time": 0, "username": ""},"tenth": {"time": 0, "username": ""}};

    let i = 0;
    let status = 401;
    for (let l in bot.levels)
    {
        if(bot.levels[l].nameList.includes(level.toLowerCase()) || bot.levels[l].actualName.toLowerCase() == level.toLowerCase()) 
        {
            top10.level = bot.levels[l].actualName;
            i = l;
            status = 200;
            break;
        }
    }

    if (status == 401) return status;

    if (bot.pbs[i].lastUpdated != undefined || bot.pbs[i].lastUpdated != null) top10.lastUpdated = bot.pbs[i].lastUpdated;

    top10.first.time = bot.pbs[i].lb[0].time/1000;
    top10.first.username = bot.pbs[i].lb[0].userName;
    top10.color = bot.pbs[i].lb[0].color;

    top10.second.time = bot.pbs[i].lb[1].time/1000;
    top10.second.username = bot.pbs[i].lb[1].userName;

    top10.third.time = bot.pbs[i].lb[2].time/1000;
    top10.third.username = bot.pbs[i].lb[2].userName;

    top10.fourth.time = bot.pbs[i].lb[3].time/1000;
    top10.fourth.username = bot.pbs[i].lb[3].userName;

    top10.fifth.time = bot.pbs[i].lb[4].time/1000;
    top10.fifth.username = bot.pbs[i].lb[4].userName;

    top10.sixth.time = bot.pbs[i].lb[5].time/1000;
    top10.sixth.username = bot.pbs[i].lb[5].userName;

    top10.seventh.time = bot.pbs[i].lb[6].time/1000;
    top10.seventh.username = bot.pbs[i].lb[6].userName;

    top10.eighth.time = bot.pbs[i].lb[7].time/1000;
    top10.eighth.username = bot.pbs[i].lb[7].userName;

    top10.ninth.time = bot.pbs[i].lb[8].time/1000;
    top10.ninth.username = bot.pbs[i].lb[8].userName;
    
    top10.tenth.time = bot.pbs[i].lb[9].time/1000;
    top10.tenth.username = bot.pbs[i].lb[9].userName;

    if (top10.color == "") top10.color = "00ffff";

    return top10;
}