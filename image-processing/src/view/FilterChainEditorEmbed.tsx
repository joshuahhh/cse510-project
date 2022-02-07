import React from "react";
import { FilterUse, newFilterUse } from "../model/filters";
import FilterChainEditor, { FilterChainEditorProps } from "./FilterChainEditor";
import Webcam from 'react-webcam';

interface FilterChainEditorEmbedProps extends FilterChainEditorProps {}

function FilterChainEditorEmbed(props: FilterChainEditorEmbedProps) {
    return <div style={{position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', borderLeft: '1px solid gray'}}>
        {<FilterChainEditor {...props} />}
    </div>;
}

export default FilterChainEditorEmbed;