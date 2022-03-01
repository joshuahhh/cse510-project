import React from "react";
import LiveEditorTool, { LiveEditorToolProps } from "./LiveEditorTool";
import root from "react-shadow";
import styles from './LiveEditorToolEmbed.css';

export interface LiveEditorToolEmbedProps extends LiveEditorToolProps {}

function LiveEditorToolEmbed(props: LiveEditorToolEmbedProps) {
    return <div className="LiveEditorToolEmbed">
        <style type="text/css">{styles}</style>
        <root.div style={{height: "100vh"}}>
            {<LiveEditorTool {...props} />}
        </root.div>
    </div>;
}

export default LiveEditorToolEmbed;