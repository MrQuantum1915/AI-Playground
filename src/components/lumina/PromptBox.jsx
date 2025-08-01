"use client";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import MyAlert from "../MyAlert";
import { getSignedURLsOfWorkspaceFiles } from "@/app/playgrounds/(playgrounds)/lumina/_actions/getSignedURLsOfWorkspaceFiles";

function PromptBox({ onPrompt, navigatingThread, onStreamResponse, setresponseComplete, Model, context, selectedFiles, CurrThreadID }) {

    const model = Model.id;

    const [awaitingResponse, setawaitingResponse] = useState(false);
    const [alert, setalert] = useState(false);
    const [alertMessage, setalertMessage] = useState("Alert");


    // auto-resizing textarea with max height
    const textareaRef = useRef(null);
    const handleInput = (e) => {
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = "auto";
            ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
            ta.style.overflowY = ta.scrollHeight > 200 ? "auto" : "hidden";
        }
    };



    async function sendToLLM() {
        const prompt = textareaRef.current.value;
        if (prompt.trim() !== "") {
            onPrompt(prompt); // react state updates are async and also bundling , so it does not update immediately. hence we can not rely on the frontend update of the message/context array, Hence we need to make new updatedContext array as below. 
            setawaitingResponse(true);

            const updatedContext = [...context, { role: "user", content: prompt }]; // this is to be done to avoid abnormal behaviour of app, because react instructs to treat state objects or array as immutable, you should not directly change the original object itself. And another reason is mentioned above beside ```onPrompt(prompt);```

            try {

                let signedURLs = [];
                if (selectedFiles && selectedFiles.length > 0) {
                    const { data, error } = await getSignedURLsOfWorkspaceFiles(CurrThreadID, selectedFiles);
                    if (error) {

                        setalertMessage("Failed to fetch signed URLs for files.");
                        setalert(true);
                        return;
                    }
                    let signedURLs = data.map(file => file.signedUrl);
                    console.log("Signed URLs:", signedURLs);
                }
                let responseText = "";

                // we need to awiat the fetch because otherwise the finally block will run immediately after the code run without awaiting the response
                const response = await fetch("/api/gemini", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model, context: updatedContext, mediaURLs: signedURLs }),
                });

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                if (!response.body) {
                    throw new Error("No response body");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let done = false;

                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;
                    if (value) {
                        const chunk = decoder.decode(value);
                        responseText += chunk;
                        onStreamResponse(responseText);
                    }
                }

            } catch (error) {
                console.error("Error in fetch:", error);
                setalertMessage("An error occurred while processing your request.");
                setalert(true);
            } finally {
                setawaitingResponse(false);
                setresponseComplete(true);
            }
        }

        else {

            setalertMessage("Please enter a prompt.");
            setalert(true);
            setawaitingResponse(false);
            // { console.log("awaitingResponse", awaitingResponse) }
        }
    }

    // useEffect(() => {
    //     handleInput();
    // }, []);

    return (
        <div className={`${navigatingThread && ("pointer-events-none")} bg-[#171717] fixed bottom-5 w-[40vw] rounded-2xl flex flex-row items-center justify-between px-2 border-1 border-white/30 z-85 hover:border-cyan-400 transition-all duration-300 ease-in-out`}>
            {
                alert && <MyAlert message={alertMessage} alertHandler={setalert} />
            }
            {/* user uploads their damn media here , just whatever*/}
            <label className="relative m-1 opacity-50">
                {/* <input onChange={handleMediaUpload} type="file" className="hidden" multiple /> */}
                <Image src={"/files.svg"} width={40} height={40} alt="Upload Media" />
                {/* {
                    (files.length != 0) &&
                    (
                        <div className="text-sm text-cyan-400 absolute z-50 top-8 left-15 rounded-sm bg-cyan-400/20 px-1  ">{selectedFiles.length}
                        </div>
                    )
                } */}
            </label>
            {/* <button className="btn m-20 border-1 border-white/30 rounded-3xl"> */}


            <textarea
                ref={textareaRef}
                id="prompt-input"
                name="prompt"
                role="take-user-prompt"
                className="text-[1.25em] overflow-hidden p-2 m-2 w-[90%]  outline-none rounded-xl border-transparent resize-none max-h-40  transition-all duration-700 ease-in-out"
                rows={1}
                onInput={handleInput}
                placeholder="What's On Your Mind...?"
                aria-label="Prompt Input"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendToLLM();
                        textareaRef.current.value = "";
                        handleInput();
                    }
                }}
            />


            <button>
                <Image
                    src={`${awaitingResponse ? "/stop.svg" : "/send.svg"}`}
                    width={40}
                    height={40}
                    alt="Submit"
                    className={`cursor-pointer opacity-90 rounded-full p-2 mx-5 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/30 active:opacity-100 ${awaitingResponse ? "animate-pulse p-3 bg-black/10 hover:rotate-90" : " bg-white/10"}`}
                    aria-label="Submit Prompt"
                    onClick={(e) => {
                        awaitingResponse ? (handleInput()) : (sendToLLM(), textareaRef.current.value = "", handleInput());
                        e.preventDefault();
                    }}
                />
            </button>
        </div >
    );
}
export default PromptBox;
