const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const wait = require(`node:timers/promises`).setTimeout;

// This command provides the user stats of a selected individual
// including how many World Records they currently hold,
// how many times they are in the top 3 or top 10. As well as how many points they have
// Users can leave `target` blank to indicated themselves.

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription("Check the stats of any player!")
        .addUserOption(option => 
            option.setName('target')
                .setDescription("User to check the stats of! - Leave blank for yourself")
                .setRequired(false)),
    async execute(interaction, bot) {

        //Create required variables
        const caller = [interaction.user, interaction.member];
        const callerName = caller[1].nickname === null ? caller[0].username : caller[1].nickname;

        let targetO = interaction.options.get("target");
        let target = targetO === null ? caller : [targetO.user, targetO.member];
        const targetName = target[1].nickname === null ? target[0].username : target[1].nickname;

        //Fetch Player Stats and Create Embed to send as response
        let stats = await getStats(target, bot)
        let embed = await createEmbed(callerName, `${targetName}'s`, stats)


        await interaction.reply({content: ``, embeds: [embed]});
    },
};

// Gather player stats from all levels they are within top 200 on the leaderboard on.
async function getStats(target, bot)
{
    let stats = {"wrs": 0, "topThrees": 0, "topTens": 0, "points": 0, "color": "00ffff"};

    for (let s of bot.stats)
    {
        if (s.discordId == target[0].id)
        {
            if (s.color !== "") stats.color = s.color;
            stats.wrs = s.wrs;
            stats.topThrees = s.topThrees;
            stats.topTens = s.topTens;
            stats.points = s.points;
            break;
        }
    }

    return stats;
}

// Create fancy embed for clear, and clean communication of information.
async function createEmbed(callerName, targetName, stats)
{
    let embed = new EmbedBuilder()
        .setColor(`#${stats.color}`)
        .setTitle(`${targetName} stats - requested by ${callerName}`)
        .addFields(
            { name: "World Records", value: `${stats.wrs}`, inline: true},
            { name: "Top Threes", value: `${stats.topThrees}`, inline: true},
            { name: "Top Tens", value: `${stats.topTens}`, inline: true},
            { name: "​", value: "​", inline: true},
            { name: "Points", value: `${stats.points}`, inline: true},
            { name: "​", value: "​", inline: true}
        ).setFooter({text: "Data might not be correct, update now only updates individual levels!"});

    return embed;
}
