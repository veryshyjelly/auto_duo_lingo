import { Button, LinearProgress } from "@mui/material";
import { Info, WS } from "./Types";
import { matchOption } from "./Action";

const Matching = ({ info, ws }: { info: Info, ws: WS }) => {
    const Option = ({ ques, op }: { ques: string, op: string }) => <>
        <div className="text-center m-4">
            <Button onClick={() => matchOption(ques, op, ws)}
                variant="outlined" fullWidth>
                <h3 className="text-[1.75rem] text-center m-2">
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

        {info.options?.map((v, i, _) => <Option ques={info.prompt || ""} op={v} key={i} />)}
    </>)
}

export default Matching;