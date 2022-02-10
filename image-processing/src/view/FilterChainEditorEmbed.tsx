import React from "react";
import FilterChainEditor, { FilterChainEditorProps } from "./FilterChainEditor";

interface FilterChainEditorEmbedProps extends FilterChainEditorProps {}

function FilterChainEditorEmbed(props: FilterChainEditorEmbedProps) {
    return <div className="FilterChainEditorEmbed">
        {<FilterChainEditor {...props} />}
    </div>;
}

export default FilterChainEditorEmbed;