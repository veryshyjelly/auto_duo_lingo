import { Button, Chip, Container, IconButton } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { ChallengeType, Info, WS } from './Types';
import ChooseOption from './ChooseOption';
import Matching from './Matching';
import ToEnglish from './ToEnglish';
import ToJapanese from './ToJapanese';
import { start } from './Action';
import WebSocketComponent from './Websocket';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


function App() {
  const infoRef = useRef<String>("");
  const [lanUrl, setLanUrl] = useState<string>("");

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

  useEffect(() => {
    fetch('/status')
      .then(res => res.json())
      .then(data => setLanUrl(data.lanUrl || ''))
      .catch(() => setLanUrl(window.location.origin));
  }, []);

  const copyLanUrl = async () => {
    const url = lanUrl || window.location.origin;
    await navigator.clipboard.writeText(url);
  };

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
        return <Container className='flex flex-col pt-[30%]' >
          <h1 className='text-center my-8 text-2xl font-bold'>{info.title || "Ready to start"}</h1>
          {info.progress > 0 && (
            <p className='text-center text-gray-500 mb-4'>Progress: {info.progress}%</p>
          )}
          {lanUrl && (
            <div className='flex items-center justify-center gap-2 mb-8'>
              <Chip label={lanUrl} variant='outlined' />
              <IconButton onClick={copyLanUrl} aria-label='copy LAN URL'>
                <ContentCopyIcon />
              </IconButton>
            </div>
          )}
          <Button onClick={() => start(ws)} variant='contained' size='large'
            color='success' className='mx-auto'>
            Start
          </Button>
        </Container>
      default:
        return (
          <Container className='flex flex-col pt-[50%]'>
            <h1 className='text-center my-8 text-2xl font-bold'>Unknown challenge type</h1>
            <p className='text-center text-gray-500'>{info.title || 'Waiting for lesson data…'}</p>
          </Container>
        )
    }
  }

  return (
    <>
      <Container fixed className='flex-col p-3 h-[45rem]'>
        <Render info={info} ws={ws} />
      </Container>
      <WebSocketComponent ws={ws} setInfo={setIt} />
    </>
  )
}

export default App
