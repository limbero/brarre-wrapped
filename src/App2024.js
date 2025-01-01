import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { dupeListToTopList, useBggForYear } from "./Data";

function App2024() {
  const year = "2024";
  const [player, setPlayer] = useState("");
  const [maratonTabell, setMaratonTabell] = useState([]);
  const [sortOn, setSortOn] = useState(["vp", true]);
  const {
    isLoading,
    gamesMetaDataByName,
    uniquePlayers,
    myPlays,
    myGames,
    myDates,
    plays,
    games,
    dates,
    mostPlayedGames,
    playerWins,
    playerScores,
    playerAppearances,
    winPercentage,
  } = useBggForYear(year, player);

  useEffect(() => {
    document.title = `Bräpped ${year}`;
  }, [year]);

  const resortMaratonTabell = useCallback((sortOn, descending) => {
    const sign = descending ? 1 : -1;
    let main, secondary;
    if (sortOn === "vp") {
      main = "vp";
      secondary = "wins";
    } else if (sortOn === "wins") {
      main = "wins";
      secondary= "vp";
    } else if (sortOn === "ratio") {
      main = "ratio";
      secondary= "wins";
    } else if (sortOn === "appearances") {
      main = "appearances";
      secondary= "wins";
    } else if (sortOn === "winsPerAppearance") {
      main = "winsPerAppearance";
      secondary= "wins";
    } else if (sortOn === "pointsPerAppearance") {
      main = "pointsPerAppearance";
      secondary= "points";
    }
    if (!uniquePlayers) {
      return;
    }
    setMaratonTabell(
      uniquePlayers.map(uPl => {
        const vp = playerScores[uPl.name];
        const wins = playerWins[uPl.username] || 0;
        const appearances = playerAppearances[uPl.username] || 0;
        return {
          name: uPl.name,
          vp,
          wins,
          ratio: (vp / wins) || 0,
          appearances: appearances,
          winsPerAppearance: (wins / appearances) || 0,
          pointsPerAppearance: (vp / appearances) || 0,
        };
      }).sort((a,b) => {
        if (a[main] > b[main]) {
          return -1 * sign;
        } else if (a[main] < b[main]) {
          return 1 * sign;
        } else if (a[secondary] > b[secondary]) {
          return -1 * sign;
        } else if (a[secondary] < b[secondary]) {
          return 1 * sign;
        } else {
          return 0
        }
      })
    );
  }, [playerAppearances, playerScores, playerWins, uniquePlayers]);

  const changeSortOn = (newSortOn) => {
    if (newSortOn === sortOn[0]) {
      setSortOn([newSortOn, !sortOn[1]]);
    } else {
      setSortOn([newSortOn, true]);
    }
  }

  useEffect(() => {
    resortMaratonTabell(sortOn[0], sortOn[1]);
  }, [resortMaratonTabell, sortOn]);

  useEffect(() => {
    if (!(playerScores && playerWins && uniquePlayers) || maratonTabell?.length > 0) {
      return;
    }
    resortMaratonTabell("vp", true);
  }, [maratonTabell, playerScores, playerWins, resortMaratonTabell, uniquePlayers]);

  if (isLoading || maratonTabell.length === 0) {
    return null;
  }

  const longestGame = {
    name: "",
    length: 0,
  };
  myPlays.forEach((gamePlay) => {
    if (gamePlay.length > longestGame.length) {
      longestGame.length = gamePlay.length;
      longestGame.name = gamePlay.game.name;
    }
  });

  const TI4 = "Twilight Imperium: Fourth Edition";
  const ti4Plays = plays.filter((play) => play.game.name === TI4);

  const globalMostPlayedGames = dupeListToTopList(
    plays.map((play) => play.game).map((game) => game.name)
  );

  return (
    <StyledApp>
      <Title>Bräpped {year}</Title>
      <select
        style={{ fontSize: "2em" }}
        value={player.username}
        onChange={(e) => {
          if (e.target.value === "") {
            setPlayer(e.target.value);
          } else {
            setPlayer(
              uniquePlayers.filter(
                (player) => player.username === e.target.value
              )[0]
            );
          }
        }}
      >
        <option value="">&nbsp;</option>
        {uniquePlayers.map((player) => (
          <option key={player.username} value={player.username}>
            {player.name}
          </option>
        ))}
      </select>
      {player ? (
        <>
          <Card>
            <p>
              Du har vart med på <strong>{myDates.length}</strong>{" "}
              brärrkvällar/dagar i år
            </p>
            <p>
              Ni klämde in <strong>{myPlays.length}</strong> omgångar av{" "}
              <strong>{myGames.length}</strong> olika spel
            </p>
            <p>
              Du vann {(playerWins[player.username] || 0) < 5 ? "bara " : ""}
              <strong>{playerWins[player.username] || 0}</strong>
              &nbsp;gånger (<strong>{winPercentage}</strong>)
              {(playerWins[player.username] || 0) < 5 ? " :(" : " :)"}
            </p>
          </Card>
          <ImgCard>
            <img
              style={{
                width: "min(80vw, 400px)",
                verticalAlign: "middle",
              }}
              alt={mostPlayedGames[0].thing}
              src={gamesMetaDataByName[mostPlayedGames[0].thing].image}
            />
          </ImgCard>
          <Card>
            <p>Dina mest spelade spel är:</p>
            <ol>
              {mostPlayedGames.map((x) => (
                <li key={x.thing}>
                  {x.thing}: {x.occurences} gånger
                </li>
              ))}
            </ol>
          </Card>
          <ImgCard>
            <img
              style={{
                width: "min(80vw, 400px)",
                verticalAlign: "middle",
              }}
              alt={longestGame.name}
              src={gamesMetaDataByName[longestGame.name].image}
            />
          </ImgCard>
        </>
      ) : (
        <>
          <Card>
            <p>
              Det har varit <strong>{dates.length}</strong> brärrkvällar/dagar i
              år
            </p>
            <p>
              Vi klämde in <strong>{plays.length}</strong> omgångar av{" "}
              <strong>{games.length}</strong> olika spel
            </p>
          </Card>
          <ImgCard>
            <img
              style={{
                width: "min(80vw, 400px)",
                verticalAlign: "middle",
              }}
              alt={TI4}
              src={gamesMetaDataByName[globalMostPlayedGames[0].thing].image}
            />
          </ImgCard>
          <Card>
            <p>De spel vi spelade mest var:</p>
            <StyledTable>
              <thead>
                <tr>
                  <th></th>
                  <th>Spel</th>
                  <th>#</th>
                </tr>
              </thead>
              <tbody>
              {globalMostPlayedGames.map((x, idx) => (
                <tr key={x.thing}>
                  <td>{idx + 1}</td>
                  <td>{x.thing}</td>
                  <td>{x.occurences}</td>
                </tr>
              ))}
              </tbody>
            </StyledTable>
          </Card>
          <ImgCard>
            <img
              style={{
                width: "min(80vw, 400px)",
                verticalAlign: "middle",
              }}
              alt={TI4}
              src={gamesMetaDataByName[TI4].image}
            />
          </ImgCard>
          <Card>
            <p>
              Vi battlade om rymden <strong>{ti4Plays.length}</strong> gånger,
              här är årets vinnare:
            </p>
            <ol>
              {ti4Plays.reverse().map((play) => (
                <li key={play.date}>
                  <strong>{play.players.find((pl) => pl.win).name}</strong>{" "}
                  som {play.players.find((pl) => pl.win).color}
                </li>
              ))}
            </ol>
          </Card>
          <ImgCard>
            <img
              style={{
                width: "min(80vw, 400px)",
                verticalAlign: "middle",
              }}
              alt={TI4}
              src={gamesMetaDataByName[globalMostPlayedGames[0].thing].image}
            />
          </ImgCard>
          <Card>
            <p>Nytt för i år, maratontabellen:</p>
            <StyledTable>
              <thead>
                <tr>
                  <th></th>
                  <th>Spelare</th>
                  <th
                    style={{cursor: "pointer"}}
                    onClick={() => changeSortOn("appearances")}
                  >
                    Spelningar&nbsp;↕
                  </th>
                  <th
                    style={{cursor: "pointer"}}
                    onClick={() => changeSortOn("vp")}
                  >
                    Poäng&nbsp;↕
                  </th>
                  <th
                    style={{cursor: "pointer"}}
                    onClick={() => changeSortOn("wins")}
                  >
                    Vinster&nbsp;↕
                  </th>
                  <th
                    style={{cursor: "pointer"}}
                    onClick={() => changeSortOn("ratio")}
                  >
                    Poäng per vinst&nbsp;↕
                  </th>
                  <th
                    style={{cursor: "pointer"}}
                    onClick={() => changeSortOn("pointsPerAppearance")}
                  >
                    Poäng per spelning&nbsp;↕
                  </th>
                  <th
                    style={{cursor: "pointer"}}
                    onClick={() => changeSortOn("winsPerAppearance")}
                  >
                    Vinster per spelning&nbsp;↕
                  </th>
                </tr>
              </thead>
              <tbody>
              {maratonTabell.map((x, idx) => (
                <tr key={x.name}>
                  <td>{idx + 1}</td>
                  <td>{x.name}</td>
                  <td>{x.appearances}</td>
                  <td>{x.vp}</td>
                  <td>{x.wins}</td>
                  <td>{x.ratio.toFixed(2)}</td>
                  <td>{x.pointsPerAppearance.toFixed(2)}</td>
                  <td>{x.winsPerAppearance.toFixed(2)}</td>
                </tr>
              ))}
              </tbody>
            </StyledTable>
          </Card>
        </>
      )}
    </StyledApp>
  );
}

const StyledTable = styled.table`
  border-collapse: collapse;
  margin: 25px 0;
  font-size: 0.9em;
  font-family: sans-serif;
  min-width: 100%;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);

  thead tr {
    background-color: #222;
    color: #ffffff;
    text-align: left;
  }
  th, td {
    padding: 12px 15px;
  }
  tbody tr {
      border-bottom: 1px solid #dddddd;
  }

  tbody tr:nth-of-type(even) {
      background-color: #f3f3f3;
  }

  tbody tr:last-of-type {
      border-bottom: 2px solid #009879;
  }
`;

const StyledApp = styled.div`
  font-family: sans-serif;
  text-align: center;

  padding: 50px;
  background-color: #222;
  min-height: 100vh;
`;

const Title = styled.h1`
  font-weight: 900;
  letter-spacing: -8px;
  font-size: 6rem;
  color: #fff;
`;

const Card = styled.section`
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  padding: 50px;
  width: min(90vw, 1700px);
  border-radius: 10px;

  margin: 50px auto;

  background-color: #fff;
  text-align: left;
  font-size: 1.5em;

  & :first-child {
    margin-top: 0;
  }
  & :last-child {
    margin-bottom: 0;
  }
`;
const ImgCard = styled(Card)`
  width: min(80vw, 400px);
  padding: 0 !important;
`;

export default App2024;
