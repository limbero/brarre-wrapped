import { useEffect, useState } from "react";

const API_URL = "https://boardgamegeek.com/xmlapi2";

export function useBggForYear(year, player) {
  const [plays, setPlays] = useState(null);
  const [games, setGames] = useState(null);

  useEffect(() => {
    if (window.DOMParser) {
      fetch(
        `${API_URL}/plays?username=wohlfart&mindate=${year}-01-01&maxdate=${year}-12-31`
      )
        .then((response) => response.text())
        .then((str) => new window.DOMParser().parseFromString(str, "text/xml"))
        .then((data) => {
          setPlays(data);
          const gameIds = Array.from(
            new Set(
              Array.from(data.querySelectorAll("item")).map((item) =>
                item.getAttribute("objectid")
              )
            )
          );
          const chunkedGameIds = chunk(gameIds, 20);
          Promise.all(
            chunkedGameIds.map((gameIdsChunk) =>
              fetch(API_URL + "/things?id=" + gameIdsChunk.join(","))
                .then((response) => response.text())
                .then((str) =>
                  new window.DOMParser().parseFromString(str, "text/xml")
                )
            )
          ).then((gamesData) => {
            setGames(
              gamesData
                .map((gamesDataChunk) =>
                  Array.from(gamesDataChunk.querySelectorAll("item"))
                )
                .flat()
            );
          });
        });
    }
  }, [year]);

  if (!plays || !games) {
    return {
      isLoading: true,
      plays: null,
      date: null,
      games: null,
      gamesMetaDataById: null,
      gamesMetaDataByName: null,
      playerWins: null,
      playerScores: null,
      uniquePlayers: null,
      myPlays: null,
      myGamesWithDupes: null,
      myGames: null,
      myGamesWithMetadata: null,
      myDates: null,
      mostPlayedGames: null,
      winPercentage: null,
    };
  }
  const playsJson = Array.from(plays.querySelectorAll("play")).map((play) => {
    return {
      game: {
        name: play.querySelector("item").getAttribute("name"),
        id: play.querySelector("item").getAttribute("objectid"),
      },
      date: play.getAttribute("date"),
      length: parseInt(play.getAttribute("length")),
      players: Array.from(play.querySelectorAll("player"))
        .map((pl) => ({
          name: pl.getAttribute("name"),
          username: pl.getAttribute("username"),
          win: pl.getAttribute("win") === "1" ? true : false,
          score: Number(pl.getAttribute("score")),
          color: pl.getAttribute("color"),
          new: pl.getAttribute("new") === "1" ? true : false,
        }))
        .map((pl) => {
          if (pl.username === "wohlfart") {
            pl.name = "Martin Wohlfart";
          }
          if (pl.name === "Lisa") {
            pl.name = "Lisa Wohlfart";
          } else if (pl.name === "Erik") {
            pl.name = "Erik Ekberg";
          } else if (pl.name === "Cesse") {
            pl.name = "Cecilia Apitzsch";
          } else if (pl.name === "Meidi") {
            pl.name = "Meidi Tõnisson-Bystam";
          } else if (pl.name === "Fredrik Bystam") {
            pl.name = "Fredrik Tõnisson-Bystam";
          }
          if (!pl.username) {
            pl.username = pl.name.replaceAll(" ", "");
          }
          return pl;
        }),
    };
  });
  const dates = Array.from(new Set(playsJson.map(gamePlay => gamePlay.date)));

  const gamesJson = [];
  const gamesMetaDataById = {};
  const gamesMetaDataByName = {};
  games.forEach((item) => {
    const name = item
      .querySelector('name[type="primary"]')
      .getAttribute("value");
    const itemAsJson = {
      thumbnail: item.querySelector("thumbnail").innerHTML,
      image: item.querySelector("image").innerHTML,
      name: name,
      description: item.querySelector("description").innerHTML,
      yearPublished: parseInt(
        item.querySelector("yearpublished").getAttribute("value")
      ),
      mechanics: Array.from(
        item.querySelectorAll('link[type="boardgamemechanic"]')
      ).map((mechanic) => mechanic.getAttribute("value")),
      designers: Array.from(
        item.querySelectorAll('link[type="boardgamedesigner"]')
      ).map((mechanic) => mechanic.getAttribute("value")),
      artists: Array.from(
        item.querySelectorAll('link[type="boardgameartist"]')
      ).map((mechanic) => mechanic.getAttribute("value")),
    };
    gamesJson.push(itemAsJson);
    gamesMetaDataById[item.getAttribute("id")] = itemAsJson;
    gamesMetaDataByName[name] = itemAsJson;
  });

  const playersWithWins = playsJson.flatMap(gamePlay => gamePlay.players);
  const playerAppearances = countOccurrences(playersWithWins.map(pl => pl.username));
  const playerWins = countOccurrences(playersWithWins.filter(pl => pl.win).map(pl => pl.username));
  const playerScores = sumOccurrences(playersWithWins);
  const uniquePlayers = Array.from(new Set(playersWithWins.map(pl => {
    return JSON.stringify({
      name: pl.name,
      username: pl.username,
    });
  }))).map(pl => JSON.parse(pl)).sort((a, b) => a.name > b.name ? 1 : -1);

  const myPlays = playsJson.filter(gamePlay => gamePlay.players.find(pl => pl.username === player.username));

  const myGamesWithDupes = myPlays.map(gamePlay => gamePlay.game);
  const myGames = Array.from(new Set(myGamesWithDupes.map(game => game.name)));
  const myGamesWithMetadata = myGames.map(gameName => gamesMetaDataByName[gameName]);
  const myDates = Array.from(new Set(myPlays.map(gamePlay => gamePlay.date)));

  const mostPlayedGames = dupeListToTopList(myGamesWithDupes.map(game => game.name));

  const winPercentage = `${(100 * ((playerWins[player.username] || 0) / myPlays.length)).toFixed(1)}%`;

  return {
    isLoading: false,
    plays: playsJson,
    dates,
    games: gamesJson,
    gamesMetaDataById,
    gamesMetaDataByName,
    playerWins,
    playerScores,
    playerAppearances,
    uniquePlayers,
    myPlays,
    myGamesWithDupes,
    myGames,
    myGamesWithMetadata,
    myDates,
    mostPlayedGames,
    winPercentage,
  };
}

function chunk(arr, chunkSize) {
  return arr.reduce((acc, cur) => {
    if (acc.length === 0) {
      return [[cur]];
    }
    if (acc[acc.length - 1].length === chunkSize) {
      return [...acc, [cur]];
    }
    const head = acc.slice(0, acc.length - 1);
    const tail = [...acc[acc.length - 1], cur];
    return [...head, tail];
  }, []);
}

function countOccurrences(arr) {
  return arr.reduce(function (a, b) {
    a[b] = a[b] + 1 || 1
    return a;
  }, {});
}

function sumOccurrences(arr) {
  return arr.reduce(function (a, b) {
    a[b.name] = a[b.name] + b.score || 0
    return a;
  }, {});
}

export function minutesToHM(d) {
  const h = Math.floor(d / 60);
  const m = Math.floor(d % 60);

  const hDisplay = h > 0 ? h + (h === 1 ? " timme" : " timmar") : "";
  const mDisplay = m > 0 ? (h > 0 ? " och " : "") + m + (m === 1 ? " minut" : " minuter") : "";
  return hDisplay + mDisplay;
}

export function dupeListToTopList(list, size = 5) {
  return Object.entries(countOccurrences(list))
    .map(([k, v]) => ({ thing: k, occurences: v }))
    .sort((a, b) => a.occurences > b.occurences ? -1 : 1)
    .slice(0, size);
}
