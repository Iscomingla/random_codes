const customFlags = {XE: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", XS: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", XW: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", XK: "🇽🇰", XP: "🇵🇸", XX: "🌐", XA: "🇮🇨", XB: "🏴", XG: "🏴", XC: "🏴"};
  
function getFlagEmoji(code) {
	if (customFlags[code]) return customFlags[code];
	const chars = code.toUpperCase().split("").map(c => 127397 + c.charCodeAt());
	return String.fromCodePoint(...chars);
}

function timeAgo(timestamp) {
	const diff = Math.floor(Date.now() / 1000) - timestamp;
	const minutes = Math.floor(diff / 60);
	const hours = Math.floor(diff / 3600);
	const days = Math.floor(diff / 86400);
	const years = Math.floor(diff / 31556952);
  
	if (diff < 3600) {
	  return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
	} else if (diff < 86400) {
	  return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
	} else if (diff < 31556952) {
		return `${days} day${days !== 1 ? 's' : ''} ago`;
	} else {
		return `${years} year${years !== 1 ? 's' : ''} ago`;
	}
}

function parsePGN(PGN) {
	let wip = PGN.replace("\\\"", "\"").split("\n");
	let out = [{}];
	wip.forEach((item) => {
		item = item.trim();
		if (item.startsWith("[") && item.endsWith("]")) {
			item = item.replace("[", "").replace("]", "").split(" ");
			const label = item.shift().toLowerCase();
			item = item.join(" ").split("");
			item.shift();
			item.pop();
			out[0][label] = item.join("").toLowerCase();
		}
		else {
			out.push(item);
		}
	});
	return out.filter(item => item);
}

async function injectUserProfile() {
	const urlParams = new URLSearchParams(window.location.search);
	const playerName = urlParams.get('player') ?? "chesscom";
	
	try {document.body.removeChild(document.getElementById("profile"));document.body.removeChild(document.getElementById("games"));} catch {};
	
	const profileDiv = document.createElement('div');
	profileDiv.setAttribute('id', "profile");
	document.body.appendChild(profileDiv);

	const gamesheader = document.createElement('h2');
	gamesheader.setAttribute('id', "gamesheader");
	gamesheader.textContent = "Games of the month";
	document.body.appendChild(gamesheader);

	const gamesDiv = document.createElement('div');
	gamesDiv.setAttribute('id', "games");
	document.body.appendChild(gamesDiv);

	try {
		const now = new Date();
		const [profileRes, gamesRes] = await Promise.all([
			fetch(`https://api.chess.com/pub/player/${playerName}`),
			fetch(`https://api.chess.com/pub/player/${playerName}/games/${now.getFullYear()}/${('00'+(now.getMonth()+1)).slice(-2)}`)
		]);
		
		if (!profileRes.ok) {alert(`Profile response status: ${profileRes.status}`); return;};
		if (!gamesRes.ok) {alert(`Games response status: ${gamesRes.status}`); return;};
		
		const [profileResult, gamesResult] = await Promise.all([profileRes.json(), gamesRes.json()]);

		profileDiv.innerHTML = buildProfile(profileResult);
		gamesDiv.innerHTML = buildGames(gamesResult.games);
	} catch (error) {
		console.error(error.message);
	}
}

function buildProfile(profile) {
	return `
		<div id="profileheader">
			<img id="avatar" src="${profile.avatar ?? "https://www.chess.com/bundles/web/images/user-image.007dad08.svg"}">
			<div id="names">
				<span id="name">${profile.title ? `<strong id="title">${profile.title}</strong>` : ""}${profile.name ?? profile.username} ${getFlagEmoji(profile.country.replace("https://api.chess.com/pub/country/", ""))}</span>
				<span id="username">${profile.username} <a href="${profile.url}" target="_blank" title="open official chess.com profile"><i class="fa-solid fa-arrow-up-right-from-square" style="color: lightgray; font-size: 0.9rem"></i></a></span>
				<span id="otherinfos">account created <strong title="${Date(profile.joined*1000)}">${timeAgo(profile.joined)}</strong> ${profile.location ? `<i class="fa-solid fa-location-dot"></i> ${profile.location}` : ""}</span>
			</div>
		</div>
	`;
}

function buildGames(games, username) {
	let out = "";
	for (const game of games) {
		out = out + `
		<div class="game">
			<span class="gameplayer">${game.black.result === "win" ? `<i class="fa-solid fa-crown"></i> <span class="winner">${game.black.username}</span>` : game.black.username} <span class="elorating">${game.black.rating}</span></span>
			<a href="${game.url}"><img class="endgame" src="https://chess-board.fly.dev/?fen=${encodeURIComponent(game.fen)}&size=500&theme=green"></a>
			<span class="gameplayer">${game.white.result === "win" ? `<i class="fa-solid fa-crown"></i> <span class="winner">${game.white.username}</span>` : game.white.username} <span class="elorating">${game.white.rating}</span></span>
		</div>
		`
	};
	return out;
}

injectUserProfile();