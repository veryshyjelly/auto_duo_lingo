import { Button, LinearProgress } from "@mui/material";
import { Info, WS } from "./Types";
import AudioPlayer from "./AudioPlayer";
import { proceed } from "./Action";

type ChallengeLayoutProps = {
    info: Info;
    ws: WS;
    children: React.ReactNode;
    footer?: React.ReactNode;
    stickyFooter?: boolean;
};

const ChallengeLayout = ({ info, ws, children, footer, stickyFooter }: ChallengeLayoutProps) => {
    return (
        <div className="flex flex-col min-h-[38rem] pb-24">
            <LinearProgress variant='determinate' value={info.progress}
                color={info.progress == 100 ? 'primary' : 'info'}
                className='mt-5 mb-12 p-2 rounded-xl' />

            <div className="flex items-center justify-between gap-2">
                <h1 className="text-[2rem] font-bold font-sans flex-1">
                    {info.title}
                </h1>
                <AudioPlayer info={info} ws={ws} />
            </div>

            {info.prompt && (
                <h2 className="text-center text-3xl mt-8 mb-10 whitespace-pre-line">
                    {info.prompt}
                </h2>
            )}

            {info.error && (
                <p className="text-center text-orange-600 text-lg mb-4">
                    Scrape failed, retrying… ({info.error})
                </p>
            )}

            {children}

            {info.rightAnswer && (
                <div className="text-red-700 text-xl text-center mt-10">
                    <p className="font-semibold mb-1">Correct solution:</p>
                    {info.rightAnswer}
                </div>
            )}

            {(info.rightAnswer || footer) && (
                <div className={stickyFooter
                    ? "fixed bottom-0 left-0 right-0 bg-white border-t p-4 text-center z-10"
                    : "text-center mt-20"}>
                    {info.rightAnswer ? (
                        <Button onClick={() => proceed(ws)} variant="contained" color="warning" size="large">
                            <span className="text-2xl mx-5">Continue</span>
                        </Button>
                    ) : footer}
                </div>
            )}
        </div>
    );
};

export default ChallengeLayout;
