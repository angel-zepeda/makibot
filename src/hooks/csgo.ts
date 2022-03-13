import { Message } from "discord.js";
import { Hook } from "../lib/hook";
import Member from "../lib/member";
import { modEventBuilder } from "../lib/modlog/actions";
import { ModEvent } from "../lib/modlog/types";
import Server from "../lib/server";

/**
 * TODO: Rename this to something different. I called it csgo.ts because the
 * first spambot was something related to CS:GO, but indeed there are a lot
 * more of stuff to track.
 *
 * Sources:
 * - https://github.com/Erisa/Cliptok
 * - https://github.com/BuildBot42/discord-scam-links
 *
 * NOTE: Whenever I receive a spamlink that is not in those repos, a PR should
 * be opened to share the spamlink with those repos as well.
 */

const TOKENS = [
  // Different variations of steamcommunity.
  /steamcommmunlity\.com/,
  /steamcommmunlity\.com/,
  /steamcconuunity\.co/,
  /steamcomminutiu\.ru/,
  /steamcomminytiy\.ru/,
  /steamcommnuntiy\.com/,
  /steamcommunityu\.com/,
  /steamcommunlty\.pro/,
  /steamcommuntry\.ru/,
  /steamcommunytiu\.com/,
  /steamcomnmuituy\.com/,
  /steancommuniit\.ru/,
  /steancomunnity\.ru/,
  /stearmcommunitty\.ru/,
  /stearmcommunity\.ru/,
  /stearncommunytiy\.ru/,
  /stearncormmunity\.com/,
  /stearncormunsity\.com/,
  /stermccommunitty\.ru/,
  /stiemcommunitty\.ru/,
  /steamcommrnunity\.com/,
  /steamcommunity\.link/,

  // There is this CSGO scam-bot
  /i will accept all trades/,
  /i'm tired of csgo/,

  // No one will give you nitro for free
  //Alphabetical ordered list
  //[a-z]
  /dlscord\.info/,
  /dlscord\.ink/,
  /dlscord\.gifts/,
  /discord\.giveawey.com/,
  /dlscord\.nitro/,
  /dlscord\.help/,
  /dlscord\.pro/,
  /discortnitosteam\.online/,
  /discortnitosteam\.online/,
  //[-]
  /discorcd-apps\.com/,
  /discord-help\./,
  /dicsord-nitro\./,
  /discord-nitre\./,
  /dlscord-nitro\./,
  /discrode-gift\./,
  /gave-nitro\./,
  /discord-nitre\./,

  // Update
  /rust-way\.com/,
  /twitch\.rust-ltd\.com/,
  /:\/\/discord-nitro\./,
  /discorcl\.link/,
  /discorcl\.click/,
  /discordapp\.click/,
  /discordapp\.link/,
  /discgrd\./,
  /disczrd\./,

  // I don't have time for this shit
  /discorcl\.[a-z]/,
  /discord-app\./,
  /dlscord\.[a-z]/,
  /discordapp\.([abd-mo-z]|c[a-n][p-z]|n[a-df-z])/,

  // risky, but i think worth
  /get 3 months/,
  /get 1 month/,
  /3 months of discord nitro/,
  /free steam give nitro/,
  /nitro steam for free/,
  /free nudes/,
];

/**
 * Test whether the message is a classic "Nitro airdrop" spam message.
 * Research shows that these kind of messages usually mention "@everyone"
 * or "@here", and also contain the following words: Discord, Nitro,
 * Steam, and a link.
 *
 * @param message the message contents that we have just received.
 */
export function isAirdrop(message: string) {
  const contains = (word: string): boolean => message.toLowerCase().indexOf(word) > -1;
  const score = (vals: boolean[]) => vals.map(Number).reduce((a, b) => a + b);
  const mentions = ["@everyone", "@here"].some(contains);
  const magicWords = score(["discord", "nitro", "steam", "airdrop"].map(contains)) >= 3;
  const hasLink = ["http://", "https://"].some(contains);
  return score([mentions, magicWords, hasLink]) >= 2;
}

/**
 * SkyBlade is the current bait message for the Bby Stealer virus that is spreading these days
 * via Discord. This function uses an heuristic to test if the message looks like Bby Stealer.
 * Bby Stealer is a RAT that will steal the execution tokens to compromise accounts:
 * https://www.reddit.com/r/discordapp/comments/s1f1vs/the_recent_try_my_game_discord_scam_explained/
 */
export function isSkyblade(message: string) {
  const contains = (word: string): boolean => message.toLowerCase().indexOf(word) > -1;
  const tokens = ["password: ", "SkyBlade", "raw/main", "my first game", "test my game", ":)"];
  return tokens.filter((t) => contains(t)).length >= 3;
}

export function containsSpamLink(content: string): boolean {
  return TOKENS.some((token) => token.test(content));
}

async function author(message: Message): Promise<Member> {
  const server = new Server(message.guild);
  return await server.member(message.author.id);
}

async function verifiedAuthor(member: Member): Promise<boolean> {
  if (member.moderator || member.user.bot) {
    return true;
  }
  const karma = await member.getKarma();
  return karma.level >= 10;
}

export default class CsgoService implements Hook {
  name = "csgo";

  async onPremoderateMessage(message: Message): Promise<ModEvent | null> {
    const member = await author(message);
    const verified = await verifiedAuthor(member);
    if (!verified) {
      const content = message.cleanContent;
      if (isAirdrop(content)) {
        return modEventBuilder(message, "BAN", "Airdrop spam");
      } else if (isSkyblade(content)) {
        return modEventBuilder(message, "BAN", "SkyBlade virus");
      } else if (containsSpamLink(content)) {
        return modEventBuilder(
          message,
          "MUTE",
          "Cadena de texto prohibida por el sistema antispam"
        );
      }
    }
    return null;
  }
}
