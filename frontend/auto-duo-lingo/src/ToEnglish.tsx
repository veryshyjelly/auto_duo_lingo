import { Button, Chip, IconButton, InputAdornment, TextField } from "@mui/material";
import { Info, WS } from "./Types";
import { useState } from "react";
import ClearIcon from '@mui/icons-material/Clear';
import { englishCheck, getChips } from "./Action";
import ChallengeLayout from "./ChallengeLayout";

const ToEnglish = ({ info, ws }: { info: Info, ws: WS }) => {
    const [input, setInput] = useState("");
    const [chips, setChips] = useState<string[]>([]);

    const Option = ({ op }: { op: string }) =>
        <Chip onClick={() => {
            let res = input + " " + op;
            setChips(getChips(info.options || [], res) || []);
            setInput(res);
        }}
            sx={{
                borderRadius: "1rem", paddingX: "0.25rem", paddingY: "1.2rem",
                fontSize: "1.25rem", margin: "3px"
            }}
            color={chips.find((v) => v.toUpperCase() == op.toUpperCase()) ? "secondary" : "primary"}
            variant="outlined"
            label={op}
        />

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            englishCheck(chips, ws);
        }
    };

    return (
        <ChallengeLayout
            info={info}
            ws={ws}
            stickyFooter
            footer={
                <Button onClick={() => englishCheck(chips, ws)} variant="outlined" color="success" size="large">
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
                    setInput(event.target.value);
                }}
            />

            <div className="my-3">
                {info.options?.map((v, i) => <Option op={v} key={i} />)}
            </div>
        </ChallengeLayout>
    )
}

export default ToEnglish;
