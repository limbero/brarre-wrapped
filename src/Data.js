import { useEffect, useState } from "react";

const API_URL = "https://boardgamegeek.com/xmlapi2";

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

export function useBggForYear(year) {
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
      games: null,
      gamesMetaDataById: null,
      gamesMetaDataByName: null,
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
          }
          if (!pl.username) {
            pl.username = pl.name.replaceAll(" ", "");
          }
          return pl;
        }),
    };
  });

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

  return {
    isLoading: false,
    plays: playsJson,
    games: gamesJson,
    gamesMetaDataById,
    gamesMetaDataByName,
  };
}
