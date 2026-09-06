import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import { Info, WS } from "./Types";
import { useState } from "react";
import ClearIcon from '@mui/icons-material/Clear';
import { checkJapanese } from "./Action";
import ChallengeLayout from "./ChallengeLayout";

const ToJapanese = ({ info, ws }: { info: Info, ws: WS }) => {
    const [input, setInput] = useState("");

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            checkJapanese(input, ws);
        }
    };

    return (
        <ChallengeLayout
            info={info}
            ws={ws}
            stickyFooter
            footer={
                <Button onClick={() => checkJapanese(input, ws)} variant="outlined" color="success" size="large">
                    <span className="text-2xl mx-5">Check</span>
                </Button>
            }
        >
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
                placeholder="Type translation"
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
        </ChallengeLayout>
    )
}

export default ToJapanese;
