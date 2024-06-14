const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { start } = require('node:repl');
const wait = require(`node:timers/promises`).setTimeout;

// This command returns an individuals personal best on a selected level
// Users can designate who they want to check or leave it blank to check themselves.

module.exports = {

    data: new SlashCommandBuilder()
        .setName('pb')
        .setDescription("Check the pb of yourself or someone else on a specific level!")
        .addStringOption(option =>
            option.setName('levelname')
                .setDescription("The level you wish to chose")
                .setRequired(true))
        .addUserOption(option => 
            option.setName('target')
                .setDescription("User to check pb of")
                .setRequired(false)),
    async execute(interaction, bot) {
        //Create required variables
        const caller = [interaction.user, interaction.member];
        const callerName = caller[1].nickname === null ? caller[0].username : caller[1].nickname;
        
        const level = interaction.options.getString("levelname");

        let targetO = interaction.options.get("target");
        let target = targetO === null ? caller : [targetO.user, targetO.member];
        const targetName = target[1].nickname === null ? target[0].username : target[1].nickname;

        //Fetch Personal Best Information
        let pbInfo = await getPB(target, level, bot)

        if(!isNaN(pbInfo))
        {
            switch (pbInfo)
            {
                case 401:
                    return interaction.reply({ content: 'The map you requested does not exist!', ephemeral: true });
                case 402:
                    return interaction.reply(`${targetName} is not in the top 200 on ${level}`);
            }
        }

        let embed = await createEmbed(callerName, `${targetName}'s`, pbInfo)

        await interaction.reply({content: ``, embeds: [embed]});
        // await wait(15000);
        // await interaction.deleteReply().catch((err) => {
        //     switch (err.status)
        //     {
        //         case 404:
        //             console.warn(`Interaction reply already deleted or not found! /${interaction.commandName} ${level} by ${interaction.user.username}`);
        //             break;
        //         default:
        //             console.error(err);
        //     }
        // });
    },
};

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
    let i = -1;
    let status = 401;
    for (let l in bot.levels)
    {
        if(bot.levels[l].nameList.includes(level.toLowerCase()) || bot.levels[l].actualName.toLowerCase() == level.toLowerCase()) 
        {
            info.level = bot.levels[l].actualName;
            i = l;
            status = 402;
            break;
        }
    }

    if (status == 401) return status;

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