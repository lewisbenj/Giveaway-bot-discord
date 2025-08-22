const { Client, IntentsBitField, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const express = require('express');
require('dotenv').config(); // Load biến môi trường từ file .env

// Khởi tạo client với các intents cần thiết
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.MessageContent,
  ],
});

// Khởi tạo Express server
const app = express();
const PORT = process.env.PORT || 3000;

// File để lưu trữ dữ liệu giveaway
const giveawaysFile = './giveaways.json';
let giveaways = [];

if (fs.existsSync(giveawaysFile)) {
  giveaways = JSON.parse(fs.readFileSync(giveawaysFile));
}

// Khi bot sẵn sàng
client.once('ready', () => {
  console.log(`Đã đăng nhập với tên ${client.user.tag}`);
  // Đặt status "Đang chơi Nguyện hộ tôi"
  client.user.setActivity('Nguyện hộ tôi', { type: 'PLAYING' });
});

// Hàm kết thúc giveaway với channelId và messageId
async function endGiveawayById(channelId, messageId) {
  try {
    const channel = await client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);
    const giveaway = giveaways.find((g) => g.id === messageId);
    if (!giveaway) return;

    const winners = await selectWinners(message, giveaway.winners);
    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway Kết Thúc!')
      .setDescription(
        winners.length > 0
          ? `**Phần thưởng**: ${giveaway.prize}\n**Người thắng**: ${winners.join(', ')}\nHãy liên hệ <@${giveaway.host}> để nhận thưởng!`
          : `**Phần thưởng**: ${giveaway.prize}\nKhông có ai tham gia.`
      )
      .setColor('#FF0000')
      .setTimestamp();

    await message.edit({ embeds: [embed] });
    giveaways = giveaways.filter((g) => g.id !== messageId);
    fs.writeFileSync(giveawaysFile, JSON.stringify(giveaways, null, 2));

    if (winners.length > 0) {
      message.channel.send(`🎉 Chúc mừng ${winners.join(', ')} đã thắng **${giveaway.prize}**!`);
    } else {
      message.channel.send('Không có người thắng vì không ai tham gia.');
    }
  } catch (error) {
    console.error('Lỗi khi kết thúc giveaway:', error);
  }
}

// Xử lý lệnh
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!mga')) return;

  const args = message.content.slice(4).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  // Lệnh !mga help
  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📚 Hướng Dẫn Lệnh Giveaway')
      .setDescription('Danh sách các lệnh của bot giveaway:')
      .addFields(
        { name: '!mga create #channel <thời gian> <số người thắng> <phần thưởng>', value: 'Tạo một giveaway mới trong kênh được chỉ định. Thời gian: 1d (ngày), 1h (giờ), 1m (phút), 1s (giây). Ví dụ: `!mga create #giveaways 1d 2 Nitro Classic`.' },
        { name: '!mga list', value: 'Liệt kê tất cả giveaway đang hoạt động trong server.' },
        { name: '!mga end <message_id>', value: 'Kết thúc giveaway sớm. Lấy ID bằng cách bật Developer Mode, click chuột phải vào tin nhắn giveaway, chọn Copy ID.' },
        { name: '!mga reroll <message_id>', value: 'Chọn lại người thắng cho giveaway đã kết thúc.' },
        { name: 'Lưu ý', value: 'Bạn cần quyền "Manage Server" để sử dụng các lệnh `create`, `end`, `reroll`.' }
      )
      .setColor('#00BFFF')
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // Lệnh !mga create
  if (command === 'create') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('Bạn cần quyền "Manage Server" để tạo giveaway.');
    }

    if (args.length < 2) {
      return message.reply('Vui lòng cung cấp đủ tham số: `#channel`, `<thời gian>`, `<số người thắng>`, và `<phần thưởng>`.');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('Vui lòng đề cập một kênh hợp lệ (e.g., #channel).');
    }

    const duration = args[1]; // Lấy thời gian từ args[1]
    const winners = parseInt(args[2]);
    const prize = args.slice(3).join(' ') || 'Phần thưởng không xác định';

    if (!duration || !/^\d+[dhms]$/.test(duration)) {
      return message.reply('Thời gian không hợp lệ. Vui lòng dùng định dạng: 1d, 1h, 30m, hoặc 10s.');
    }

    if (isNaN(winners) || winners < 1) {
      return message.reply('Số người thắng phải là một số nguyên dương.');
    }

    const timeUnits = { d: 86400, h: 3600, m: 60, s: 1 };
    const unit = duration.slice(-1);
    const timeValue = parseInt(duration);
    const time = timeValue * timeUnits[unit] * 1000;
    const endTime = Date.now() + time;

    if (time <= 0) {
      return message.reply('Thời gian phải lớn hơn 0.');
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway!')
      .setDescription(`**Phần thưởng**: ${prize}\n**Người thắng**: ${winners}\n**Kết thúc**: <t:${Math.floor(endTime / 1000)}:R>\nNhấn 🎉 để tham gia!`)
      .setColor('#FF0000')
      .setTimestamp();

    try {
      // Xóa tin nhắn của người dùng
      if (message.deletable) {
        await message.delete().catch(console.error);
      }

      const giveawayMessage = await channel.send({ embeds: [embed] });
      await giveawayMessage.react('🎉');

      const giveaway = {
        id: giveawayMessage.id,
        channelId: channel.id,
        guildId: message.guild.id,
        prize,
        winners,
        endTime,
        host: message.author.id,
      };

      giveaways.push(giveaway);
      fs.writeFileSync(giveawaysFile, JSON.stringify(giveaways, null, 2));

      // Sử dụng setTimeout với hàm callback
      setTimeout(() => endGiveawayById(channel.id, giveawayMessage.id), time);
    } catch (error) {
      console.error('Lỗi khi tạo giveaway:', error);
      message.channel.send('Đã xảy ra lỗi khi tạo giveaway. Vui lòng kiểm tra quyền hoặc thử lại.');
    }
  }

  // Lệnh !mga list
  if (command === 'list') {
    const activeGiveaways = giveaways.filter((g) => g.guildId === message.guild.id && g.endTime > Date.now());
    if (activeGiveaways.length === 0) {
      return message.reply('Không có giveaway nào đang hoạt động.');
    }

    const embed = new EmbedBuilder()
      .setTitle('Danh sách Giveaway')
      .setDescription(
        activeGiveaways
          .map((g) => `**ID**: ${g.id}\n**Phần thưởng**: ${g.prize}\n**Kênh**: <#${g.channelId}>\n**Kết thúc**: <t:${Math.floor(g.endTime / 1000)}:R>`)
          .join('\n\n')
      )
      .setColor('#00FF00');

    message.reply({ embeds: [embed] });
  }

  // Lệnh !mga end
  if (command === 'end') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('Bạn cần quyền "Manage Server" để kết thúc giveaway.');
    }

    const giveawayId = args[0];
    const giveaway = giveaways.find((g) => g.id === giveawayId && g.guildId === message.guild.id);
    if (!giveaway) {
      return message.reply('Không tìm thấy giveaway với ID này.');
    }

    const channel = await client.channels.fetch(giveaway.channelId);
    const giveawayMessage = await channel.messages.fetch(giveawayId);
    endGiveawayById(giveaway.channelId, giveawayId);
  }

  // Lệnh !mga reroll
  if (command === 'reroll') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('Bạn cần quyền "Manage Server" để reroll giveaway.');
    }

    const giveawayId = args[0];
    const giveaway = giveaways.find((g) => g.id === giveawayId && g.guildId === message.guild.id);
    if (!giveaway) {
      return message.reply('Không tìm thấy giveaway với ID này.');
    }

    const channel = await client.channels.fetch(giveaway.channelId);
    const giveawayMessage = await channel.messages.fetch(giveawayId);
    const winners = await selectWinners(giveawayMessage, giveaway.winners);

    if (winners.length === 0) {
      return channel.send('Không có ai tham gia để chọn lại người thắng.');
    }

    channel.send(`🎉 Chúc mừng người thắng mới: ${winners.join(', ')}! Hãy liên hệ <@${giveaway.host}> để nhận **${giveaway.prize}**!`);
  }
});

// Hàm chọn người thắng
async function selectWinners(message, winnerCount) {
  const reaction = message.reactions.cache.get('🎉');
  if (!reaction) return [];

  const users = await reaction.users.fetch();
  const validUsers = users.filter((user) => !user.bot && user.id !== message.author.id).map((user) => user);

  if (validUsers.length === 0) return [];

  const winners = [];
  for (let i = 0; i < Math.min(winnerCount, validUsers.length); i++) {
    const index = Math.floor(Math.random() * validUsers.length);
    winners.push(validUsers[index]);
    validUsers.splice(index, 1);
  }

  return winners;
}

// ===================== WEB KEEP-ALIVE / HEALTH =====================
app.head('/', (req, res) => {
  res.setHeader('Connection', 'keep-alive');
  res.status(200).end();
});

app.get('/', (req, res) => {
  res.setHeader('Connection', 'keep-alive');
  res.status(200).send('Bot is running!');
});

app.get('/ping', (req, res) => {
  res.setHeader('Connection', 'keep-alive');
  res.status(200).json({ ok: true, ts: Date.now() });
});

app.get('/status', (req, res) => {
  res.setHeader('Connection', 'keep-alive');
  res.status(200).json({
    ok: true,
    uptime: Math.round(process.uptime()),
    pid: process.pid,
    memory: process.memoryUsage(),
    bot: {
      ready: !!client.user,
      user: client.user ? client.user.tag : null,
      guilds: client.guilds ? client.guilds.cache.size : 0,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ===================== SAFETY: LOG UNHANDLED ERRORS =====================
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED_REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT_EXCEPTION:', err);
});

// Đăng nhập bot bằng token từ .env
client.login(process.env.BOT_TOKEN);

//code by Benjamin Lewis 
