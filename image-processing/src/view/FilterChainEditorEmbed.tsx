import React from "react";
import FilterChainEditor, { FilterChainEditorProps } from "./FilterChainEditor";
import root from "react-shadow";
import styles from './FilterChainEditorEmbed.css';

interface FilterChainEditorEmbedProps extends FilterChainEditorProps {}

function FilterChainEditorEmbed(props: FilterChainEditorEmbedProps) {
    return <div className="FilterChainEditorEmbed">
        <style type="text/css">{styles}</style>
        <root.div style={{height: "100vh"}}>
            {<FilterChainEditor {...props} />}
        </root.div>
    </div>;
}

export default FilterChainEditorEmbed;