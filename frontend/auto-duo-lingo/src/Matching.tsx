import { Button } from "@mui/material";
import { Info, WS } from "./Types";
import { matchOption } from "./Action";
import ChallengeLayout from "./ChallengeLayout";

const Matching = ({ info, ws }: { info: Info, ws: WS }) => {
    const Option = ({ ques, op }: { ques: string, op: string }) => <>
        <div className="text-center m-4">
            <Button onClick={() => matchOption(ques, op, ws)}
                variant="outlined" fullWidth
                sx={{ minHeight: 56 }}>
                <h3 className="text-[1.75rem] text-center m-2">
                    {op}
                </h3>
            </Button>
        </div>
    </>

    return (
        <ChallengeLayout info={info} ws={ws}>
            {info.options?.map((v, i) => <Option ques={info.prompt || ""} op={v} key={i} />)}
        </ChallengeLayout>
    )
}

export default Matching;
