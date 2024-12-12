import { Button, IconButton, InputAdornment, LinearProgress, TextField } from "@mui/material";
import { Info, WS } from "./Types";
import { useState } from "react";
import ClearIcon from '@mui/icons-material/Clear';
import { checkJapanese } from "./Action";

const ToJapanese = ({ info, ws }: { info: Info, ws: WS }) => {

    const [input, setInput] = useState("");

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent adding a new line
            checkJapanese(input, ws);
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
            sx={{
                "& .MuiInputBase-input": {
                    fontSize: "25px",
                }
            }}
            placeholder="Type in Japanese"
            slotProps={{
                input: {
                    endAdornment: <InputAdornment position="end">
                        <IconButton onClick={() => { setInput("") }}>
                            <ClearIcon />
                        </IconButton>
                    </InputAdornment>
                }
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setInput(event.target.value);
            }}
        />

        <div className="text-center mt-32">
            <Button onClick={() => checkJapanese(input, ws)} variant="outlined" color="success">
                <h1 className="text-2xl">Check</h1>
            </Button>
        </div>
    </>)
}

export default ToJapanese;