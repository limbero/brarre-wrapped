import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Confetti from 'react-confetti';
import { dupeListToTopList, minutesToHM, useBggForYear } from './Data';

function App2023() {
  const year = "2023";
  const [player, setPlayer] = useState("");
  const {
    isLoading,
    gamesMetaDataByName,
    uniquePlayers,
    myPlays,
    myGames,
    myGamesWithMetadata,
    myDates,
    mostPlayedGames,
    playerWins,
    winPercentage,
  } = useBggForYear(year, player);

  useEffect(() => {
    document.title = `Bräpped ${year}`;
  }, [year]);

  if (isLoading) {
    return null;
  }

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
    <StyledApp>
      <Confetti style={{ position: "fixed" }} />
      <Title>Bräpped {year}</Title>
      <select
        style={{ fontSize: "2em" }}
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
      {player ? (<>
        <Card>
          <p>Du har vart med på <strong>{myDates.length}</strong> brärrkvällar/dagar i år</p>
          <p>Ni klämde in <strong>{myPlays.length}</strong> omgångar av <strong>{myGames.length}</strong> olika spel</p>
          <p>
            Du vann {(playerWins[player.username] || 0) < 5 ? "bara " : ""}<strong>{playerWins[player.username] || 0}</strong>
            &nbsp;gånger (<strong>{winPercentage}</strong>){(playerWins[player.username] || 0) < 5 ? " :(" : " :)"}
          </p>
        </Card>
        <ImgCard>
          <img
            style={{
              width: "min(80vw, 600px)",
              verticalAlign: "middle",
            }}
            alt={mostPlayedGames[0].thing}
            src={gamesMetaDataByName[mostPlayedGames[0].thing].image}
          />
        </ImgCard>
        <Card>
          <p>Dina mest spelade spel är:</p>
          <ol>
            {
              mostPlayedGames.map(x => (
                <li key={x.thing}>{x.thing}: {x.occurences} gånger</li>
              ))
            }
          </ol>
        </Card>
        <ImgCard>
          <img
            style={{
              width: "min(80vw, 600px)",
              verticalAlign: "middle",
            }}
            alt={longestGame.name}
            src={gamesMetaDataByName[longestGame.name].image}
          />
        </ImgCard>
        <Card>
          <p>Ditt längsta brärr var en omgång <strong>{longestGame.name}</strong> som höll på i <strong>{minutesToHM(longestGame.length)}</strong>!</p>
          <p>Nyaste spelet var: <strong>{newestGame.name}</strong> ({newestGame.yearPublished})</p>
          <p>Äldst: <strong>{oldestGame.name}</strong> ({oldestGame.yearPublished})</p>
        </Card>
        <ImgCard>
          <img
            style={{
              width: "min(80vw, 600px)",
              verticalAlign: "middle",
            }}
            alt={newestGame.name}
            src={gamesMetaDataByName[newestGame.name].image}
          />
        </ImgCard>
        <Card>
          <p>Favoritdesigners</p>
          <ol>
            {
              topDesigners.map(x => (
                <li key={x.thing}>{x.thing}: {x.occurences}</li>
              ))
            }
          </ol>
        </Card>
        <ImgCard>
          <img
            style={{
              width: "min(80vw, 600px)",
              verticalAlign: "middle",
            }}
            alt={myGamesWithMetadata.find(game => game.designers.includes(topDesigners[0].thing)).name}
            src={myGamesWithMetadata.find(game => game.designers.includes(topDesigners[0].thing)).image}
          />
        </ImgCard>
        <Card>
          <p>Du gillar när de här ritar skiten</p>
          <ol>
            {
              topArtists.map(x => (
                <li key={x.thing}>{x.thing}: {x.occurences}</li>
              ))
            }
          </ol>
        </Card>
        <ImgCard>
          <img
            style={{
              width: "min(80vw, 600px)",
              verticalAlign: "middle",
            }}
            alt={myGamesWithMetadata.find(game => game.artists.includes(topArtists[0].thing)).name}
            src={myGamesWithMetadata.find(game => game.artists.includes(topArtists[0].thing)).image}
          />
        </ImgCard>
        <Card>
          <p>Mechanics du inte fick nog av</p>
          <ol>
            {
              topMechanics.map(x => (
                <li key={x.thing}>{x.thing}: {x.occurences}</li>
              ))
            }
          </ol>
        </Card>
        <ImgCard>
          <img
            style={{
              width: "min(80vw, 600px)",
              verticalAlign: "middle",
            }}
            alt={myGamesWithMetadata.find(game => game.mechanics.includes(topMechanics[0].thing)).name}
            src={myGamesWithMetadata.find(game => game.mechanics.includes(topMechanics[0].thing)).image}
          />
        </ImgCard>
      </>) : null}
    </StyledApp>
  );
}

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
  color: #FFF;
`;

const Card = styled.section`
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  padding: 50px;
  width: min(80vw, 600px);
  border-radius: 10px;

  margin: 50px auto;

  background-color: #FFF;
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
  padding: 0 !important;
`;

export default App2023;
