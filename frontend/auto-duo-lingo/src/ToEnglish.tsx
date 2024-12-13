import { Button, IconButton, InputAdornment, LinearProgress, TextField } from "@mui/material";
import { Info, WS } from "./Types";
import { useState } from "react";
import ClearIcon from '@mui/icons-material/Clear';
import { englishCheck, getChips } from "./Action";

const ToEnglish = ({ info, ws }: { info: Info, ws: WS }) => {
    const [input, setInput] = useState("");
    const [chips, setChips] = useState<string[]>([]);

    const Option = ({ op }: { op: string }) =>
        <Button onClick={() => {
            let res = input + " " + op;
            setChips(getChips(info.options || [], res) || []);
            setInput(res);
        }}
            sx={{ borderRadius: "1rem", fontSize: "1rem", margin: "3px" }}
            color={chips.find((v) => v.toUpperCase() == op.toUpperCase()) ? "secondary" : "primary"}
            variant="outlined">
            {op}
        </Button>

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent adding a new line
            englishCheck(chips, ws);
        }
    };

    return (<>
        <LinearProgress variant='determinate' value={info.progress}
            color={info.progress == 100 ? 'primary' : 'info'}
            className='mt-5 mb-12 p-2 rounded-xl' />

        <h1 className="text-[2rem] font-bold font-sans">
            {info.title}
        </h1>

        <h2 className="text-center text-3xl mt-8 mb-10">
            {info.prompt}
        </h2>

        <TextField multiline
            rows={3} fullWidth
            variant='outlined'
            className='text-2xl'
            color='primary'
            value={input}
            onKeyDown={handleKeyDown}
            placeholder="Type in English"
            sx={{
                "& .MuiInputBase-input": {
                    fontSize: "25px",
                }
            }}
            slotProps={{
                input: {
                    endAdornment: <InputAdornment position="end">
                        <IconButton onClick={() => { setInput(""); setChips([]) }}>
                            <ClearIcon />
                        </IconButton>
                    </InputAdornment>
                }
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setChips(getChips(info.options || [], event.target.value) || []);
                console.log(`chips: ${chips}`)
                setInput(event.target.value);
            }}
        />

        <div className="my-3">
            {info.options?.map((v, i, _) => <Option op={v} key={i} />)}
        </div>

        <div className="text-red-700 text-xl text-center mt-10">
            {info.rightAnswer}
        </div>

        <div className="text-center mt-20">
            <Button onClick={() => englishCheck(chips, ws)} variant="outlined" color="success">
                <h1 className="text-2xl mx-5">Check</h1>
            </Button>
        </div>
    </>)
}

export default ToEnglish;