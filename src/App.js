import { useEffect, useState } from 'react';

function countOccurrences(arr) {
  return arr.reduce(function (a, b) {
    a[b] = a[b] + 1 || 1
    return a;
  }, {});
}

function minutesToHM(d) {
  const h = Math.floor(d / 60);
  const m = Math.floor(d % 60);

  const hDisplay = h > 0 ? h + (h === 1 ? " timme" : " timmar") : "";
  const mDisplay = m > 0 ? (h > 0 ? " och " : "") + m + (m === 1 ? " minut" : " minuter") : "";
  return hDisplay + mDisplay;
}

function dupeListToTopList(list, size = 5) {
  return Object.entries(countOccurrences(list))
    .map(([k, v]) => ({ thing: k, occurences: v }))
    .sort((a, b) => a.occurences > b.occurences ? -1 : 1)
    .slice(0, size);
}

const API_URL = "https://boardgamegeek.com/xmlapi2";
function App() {
  const [plays, setPlays] = useState(null);
  const [games, setGames] = useState(null);
  const [player, setPlayer] = useState("");

  useEffect(() => {
    if (window.DOMParser) {
      fetch(API_URL + "/plays\?username\=wohlfart\&mindate\=2023-01-01&maxdate\=2023-12-31")
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
          setPlays(data);
          const gameIds = Array.from(new Set(Array.from(data.querySelectorAll("item")).map(item => item.getAttribute("objectid")))).join(",");
          fetch(API_URL + "/things?id=" + gameIds)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(gamesData => {
              setGames(gamesData);
            });
        });
    }
  }, []);

  if (!plays || !games) {
    return null;
  }
  const playsJson = Array.from(plays.querySelectorAll("play"))
    .map(play => {
      return {
        game: {
          name: play.querySelector("item").getAttribute("name"),
          id: play.querySelector("item").getAttribute("objectid"),
        },
        date: play.getAttribute("date"),
        length: parseInt(play.getAttribute("length")),
        players: Array.from(play.querySelectorAll("player"))
          .map(pl => ({
            name: pl.getAttribute("name"),
            username: pl.getAttribute("username"),
            win: pl.getAttribute("win") === "1" ? true : false,
          }))
          .map(pl => {
            if (pl.username === "wohlfart") {
              pl.name = "Martin Wohlfart";
            }
            if (pl.name === "Lisa") {
              pl.name = "Lisa Wohlfart";
            } else if (pl.name === "Erik") {
              pl.name = "Erik Ekberg";
            } else if (pl.name === "Cesse") {
              pl.name = "Cecilia Apitzsch";
            }
            if (!pl.username) {
              pl.username = pl.name.replaceAll(" ", "");
            }
            return pl;
          })
      };
    });

  const gamesJson = [];
  const gamesMetaDataById = {};
  const gamesMetaDataByName = {};
  Array.from(games.querySelectorAll("item")).forEach(item => {
    const name = item.querySelector('name[type="primary"]').getAttribute("value");
    const itemAsJson = {
      thumbnail: item.querySelector("thumbnail").innerHTML,
      image: item.querySelector("image").innerHTML,
      name: name,
      description: item.querySelector("description").innerHTML,
      yearPublished: parseInt(item.querySelector("yearpublished").getAttribute("value")),
      mechanics: Array.from(
        item.querySelectorAll('link[type="boardgamemechanic"]')
      ).map(mechanic => mechanic.getAttribute("value")),
      designers: Array.from(
        item.querySelectorAll('link[type="boardgamedesigner"]')
      ).map(mechanic => mechanic.getAttribute("value")),
      artists: Array.from(
        item.querySelectorAll('link[type="boardgameartist"]')
      ).map(mechanic => mechanic.getAttribute("value")),
    };
    gamesJson.push(itemAsJson);
    gamesMetaDataById[item.getAttribute("id")] = itemAsJson;
    gamesMetaDataByName[name] = itemAsJson;
  });

  const playersWithWins = playsJson.flatMap(gamePlay => gamePlay.players);
  const playerWins = countOccurrences(playersWithWins.filter(pl => pl.win).map(pl => pl.username));
  const uniquePlayers = Array.from(new Set(playersWithWins.map(pl => {
    const clonedPlayer = structuredClone(pl);
    delete clonedPlayer.win;
    return JSON.stringify(clonedPlayer);
  }))).map(pl => JSON.parse(pl)).sort((a, b) => a.name > b.name ? 1 : -1);

  const myPlays = playsJson.filter(gamePlay => gamePlay.players.find(pl => pl.username === player.username));

  const myGamesWithDupes = myPlays.map(gamePlay => gamePlay.game);
  const myGames = Array.from(new Set(myGamesWithDupes.map(game => game.name)));
  const myGamesWithMetadata = myGames.map(gameName => gamesMetaDataByName[gameName]);
  const myDates = Array.from(new Set(myPlays.map(gamePlay => gamePlay.date)));

  const mostPlayedGames = dupeListToTopList(myGamesWithDupes.map(game => game.name));

  const topDesigners = dupeListToTopList(myGamesWithMetadata.flatMap(game => game.designers));
  const topArtists = dupeListToTopList(myGamesWithMetadata.flatMap(game => game.artists));
  const topMechanics = dupeListToTopList(myGamesWithMetadata.flatMap(game => game.mechanics));

  const gamesChronological = myGamesWithMetadata.sort((a, b) => a.yearPublished > b.yearPublished ? 1 : -1);
  const oldestGame = gamesChronological[0];
  const newestGame = gamesChronological.at(-1);

  const longestGame = {
    name: "",
    length: 0,
  };
  myPlays.forEach(gamePlay => {
    if (gamePlay.length > longestGame.length) {
      longestGame.length = gamePlay.length;
      longestGame.name = gamePlay.game.name;
    }
  });

  return (
    <div className="App">
      (
      <select
        value={player.username}
        onChange={e => {
          setPlayer(uniquePlayers.filter(player => player.username === e.target.value)[0]);
        }}
      >
        {player ? null : <option value="" />}
        {
          uniquePlayers.map(player => (
            <option key={player.username} value={player.username}>{player.name}</option>
          ))
        }
      </select>
      )
      {player ? (<>
        <section>
          <p>Du har vart med på {myDates.length} brärrkvällar/dagar i år</p>
          <p>Ni klämde in {myPlays.length} omgångar av {myGames.length} olika spel</p>
          <p>Du vann {(playerWins[player.username] || 0) < 5 ? "bara " : ""}{playerWins[player.username] || 0} gånger{(playerWins[player.username] || 0) < 5 ? " :(" : " :)"}</p>
        </section>
        <section>
          <p>Dina mest spelade spel är:</p>
          <ol>
            {
              mostPlayedGames.map(x => (
                <li key={x.thing}>{x.thing}: {x.occurences} gånger</li>
              ))
            }
          </ol>
        </section>
        <section>
          <p>Ditt längsta brärr var en omgång {longestGame.name} som höll på i {minutesToHM(longestGame.length)}!</p>
          <p>Nyaste spelet var: {newestGame.name} ({newestGame.yearPublished})</p>
          <p>Äldst: {oldestGame.name} ({oldestGame.yearPublished})</p>
        </section>
        <section>
          <p>Du har spelat flest spel designade av:</p>
          <ol>
            {
              topDesigners.map(x => (
                <li key={x.thing}>{x.thing}: {x.occurences}</li>
              ))
            }
          </ol>
        </section>
        <section>
          <p>Konstnärer i topp:</p>
          <ol>
            {
              topArtists.map(x => (
                <li key={x.thing}>{x.thing}: {x.occurences}</li>
              ))
            }
          </ol>
        </section>
        <section>
          <p>Spelmechanics:</p>
          <ol>
            {
              topMechanics.map(x => (
                <li key={x.thing}>{x.thing}: {x.occurences}</li>
              ))
            }
          </ol>
        </section>
      </>) : null}
    </div>
  );
}

export default App;
