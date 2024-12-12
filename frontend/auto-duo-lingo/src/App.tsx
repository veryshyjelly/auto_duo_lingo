import { Button, Container } from '@mui/material';
import './App.css'
import { useRef, useState } from 'react';
import { ChallengeType, Info, WS } from './Types';
import ChooseOption from './ChooseOption';
import Matching from './Matching';
import ToEnglish from './ToEnglish';
import ToJapanese from './ToJapanese';
import { start } from './Action';
import WebSocketComponent from './Websocket';


function App() {
  const { host } = window.location;
  const [addr, _] = host.split(":");
  const infoRef = useRef<String>("");

  const [info, setInfo] = useState<Info>({
    progress: 0,
    type: ChallengeType.Nothing
  });

  const setIt = (val: string) => {
    if (infoRef.current != val) {
      infoRef.current = val;
      setInfo(JSON.parse(val))
      console.log("[UPDATE] :", val);
    }
  }

  const ws = useRef<WebSocket | null>(null);

  const Render = ({ info, ws }: { info: Info, ws: WS }) => {
    switch (info.type) {
      case ChallengeType.ChooseOption:
        return <ChooseOption info={info} ws={ws} />
      case ChallengeType.Matching:
        return <Matching info={info} ws={ws} />
      case ChallengeType.ToEnglish:
        return <ToEnglish info={info} ws={ws} />
      case ChallengeType.ToJapanese:
        return <ToJapanese info={info} ws={ws} />
      case ChallengeType.Nothing:
        return <Container className='flex flex-col pt-[50%]' >
          <h1 className='text-center my-32 text-2xl font-bold'>{info.title || ""}</h1>
          <Button onClick={() => start(ws)} variant='contained' size='large'
            color='success' className='mx-auto'>
            Start
          </Button>
        </Container>
      default:
        console.log(info.type)
        return <>something</>
    }
  }

  return (
    <>
      <Container fixed className='flex-col p-3 h-[45rem]'>
        <Render info={info} ws={ws} />
      </Container>
      <WebSocketComponent addr={addr} ws={ws} setInfo={setIt} />
    </>
  )
}

export default App
