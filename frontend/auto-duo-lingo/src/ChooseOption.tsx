import { Button } from "@mui/material";
import { Info, WS } from "./Types";
import { chooseOption } from "./Action";
import ChallengeLayout from "./ChallengeLayout";

const ChooseOption = ({ info, ws }: { info: Info, ws: WS }) => {
    const Option = ({ op }: { op: string }) => <>
        <div className="text-center m-4">
            <Button onClick={() => chooseOption(op, ws)}
                variant="outlined" fullWidth
                sx={{ minHeight: 56 }}
            >
                <h3 className="text-[1.75rem] text-center m-3">
                    {op}
                </h3>
            </Button>
        </div>
    </>

    return (
        <ChallengeLayout info={info} ws={ws}>
            {info.options?.map((v, i) => <Option op={v} key={i} />)}
        </ChallengeLayout>
    )
}

export default ChooseOption;
