# RandomRoulette

A stranger picks up. A camera blinks on. Somewhere else in the world, someone was also just staring at a "find a match" button, also not sure who'd show up. That's the whole premise here — no profiles to swipe, no algorithm pretending it knows you, just a room, a mood, and whoever else is waiting in that same queue right now.
<p align="center">
  <img src="./docs/homepage.png" width="800" alt="Mood and interest picker before a call starts" />
  <br/><em>Choosing a mood is optional — leave it blank and you're matched with anyone online.</em>
</p>

## The shape of a session

You land, you optionally pick a vibe — casual chat, study, networking, or nothing at all — and the app tells you, live, how many other people are sitting in that same queue. Not a static "join now" button into a void. A number that moves.

Hit find, and the matching happens on the server the moment two compatible sockets exist: your mood's queue first, then the general pool if nobody's there yet. First match wins, room gets created, and one side becomes the WebRTC offer initiator without either of you needing to know or care which one you are.

<p align="center">
  <img src="./docs/chat-page.png" width="800" alt="Active video call with chat sidebar" />
  <br/><em>Full video on the left, your own feed tucked in the corner, live chat on the right.</em>
</p>

## What is Happenindg on the Video Call:
The call itself sits at 70/30 — their video takes the room, yours rides along as a small picture-in-picture, and a chat panel sits alongside it for anything that's easier typed than said. Mute, camera off, skip, end, save, report — all one row of controls along the bottom, all reachable without hunting.

Skip doesn't dump you back to a menu. It quietly re-queues you into the same mood you started with, so the rhythm of "talk, skip, talk again" will never breaks. Save keeps someone in your history on purpose, for the rare match worth remembering. Report exists for the opposite reason, and it actually costs the reported person reputation — not a black hole complaint box.

## Under the hood, briefly
The video/audio itself never touches the server — it's peer-to-peer WebRTC, the way it should be for a two-person call. The server's only job in that exchange is introductions: pairing two sockets, then getting out of the way while offer, answer, and ICE candidates pass through it just long enough to establish the direct connection.

Everything that *should* persist does — sessions, reputations, reports — sitting in Postgres behind a small Express API, with the schema arriving as plain, readable `.sql` migration files that run themselves on boot. Nothing fancy, nothing hidden behind an ORM you'd have to reverse-engineer to understand what's actually in the database.

<p align="center">
  <img src="./docs/screenshot-profile.png" width="800" alt="User profile with reputation score" />
  <br/><em>A reputation score, not a follower count — earned from how sessions actually go.</em>
</p>

## Reputation, not popularity

Most "talk to strangers" apps have no memory of how someone behaved last time. This one does, quietly. Every user starts at a clean 100. Get reported, lose a few points. It's not public shaming — there's no visible history of who reported whom — just a single number, color-coded on a profile, that gives the next person you match with a rough sense of whether this stranger has been reported to have caused problems.

## Two ways in, same instincts

Not everyone wants to be on camera. The chat-only mode shares the exact same matching logic — mood queues, live counts, skip-to-requeue — but strips the WebRTC layer out entirely, so it loads faster and asks nothing of your camera or microphone. Same stranger-finding heart, lighter body.

## Two doors into the same room

Video and chat-only aren't ranked — the nav bar lists "Join Video Call" and "Chat Someone" side by side, same size, same weight, because neither is the fallback version of the other. Someone on a train with no headphones and someone at home with good lighting are both having a real conversation with a stranger; the app just meets each of them where they actually are.

## Anonymous by default, accountable when it matters

You don't need an account to talk to someone. Anonymous mode exists for exactly that — jump in, have the conversation, leave no trace tied to an identity. Accounts exist for the people who want continuity: a history of who they talked to, a reputation worth protecting, a profile worth coming back to. Neither path is treated as the "real" one.

## What you're not asked for

No email verification wall before you can talk to someone. No mandatory profile photo. No "tell us about yourself" essay box. The only thing standing between opening the app and being on a call with a stranger is a single click — everything else, the account, the reputation, the saved history, is optional infrastructure for people who decide they want it after the fact, not a toll booth before the first conversation.

## The queue is honest about itself

There's no fake "1,204 people online" banner. The number you see next to each mood is the actual size of that mood's waiting set on the server at that moment — it goes up when someone joins, down the instant they're matched or they cancel. If a mood is quiet at 3am, the app shows you a quiet queue instead of manufacturing urgency that isn't there.

## Why a signaling server instead of a video SDK

It would have been faster to bolt on a third-party video SDK and call it done. The tradeoff wasn't taken lightly — running your own signaling layer means owning the offer/answer/ICE dance yourself, understanding why a connection state flips to `failed`, and accepting that NAT traversal is sometimes just going to lose. What it buys back is control: no per-minute billing tied to how many strangers happen to talk to each other today, and no black box between two people's actual video streams.

## The moment a call ends

Nothing lingers awkwardly. Skip re-queues instantly. End drops you to a calm, deliberate "session ended" screen rather than snapping you back into the queue mid-thought — a small pause between one stranger and the next, on purpose. Save and report both fire in that same window, because that's the only moment either action makes sense: right after, while it's still fresh.

## Sessions as evidence, not surveillance
Every call leaves a small traces that i left behind — how long it ran, what mood it was matched under, whether it ended cleanly or got skipped. That trace exists for exactly two reasons: so reputation has something real to stand on, and so a user can look back at their own history if they want to. It isn't a transcript, it isn't a recording, and it isn't shared with the other person. Just a timestamp and an outcome.