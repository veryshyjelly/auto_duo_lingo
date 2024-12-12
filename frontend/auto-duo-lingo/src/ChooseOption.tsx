import { Button, LinearProgress } from "@mui/material";
import { Info, WS } from "./Types";
import { chooseOption } from "./Action";

const ChooseOption = ({ info, ws }: { info: Info, ws: WS }) => {
    const Option = ({ op }: { op: string }) => <>
        <div className="text-center m-4">
            <Button onClick={() => chooseOption(op, ws)}
                variant="outlined" fullWidth
            >
                <h3 className="text-[1.75rem] text-center m-3">
                    {op}
                </h3>
            </Button>
        </div>
    </>

    return (<>
        <LinearProgress variant='determinate' value={info.progress}
            color={info.progress == 100 ? 'primary' : 'info'}
            className='mt-5 mb-12 p-2 rounded-xl' />

        <h1 className="text-3xl font-bold font-sans">
            {info.title}
        </h1>

        <h2 className="text-center text-3xl my-10">
            {info.prompt}
        </h2>

        {info.options?.map((v, i, _) => <Option op={v} key={i} />)}
    </>)
}

export default ChooseOption;